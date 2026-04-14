import type { MpfFund } from '@/hooks/useMpfFunds';
import type { ReturnField } from '@/lib/returnFields';
import { getFallbackReturn } from '@/lib/fallbackReturn';

/** Extract base fund name and unit class from name like "安聯均衡基金 - 單位A" or "宏利退休精選安聯均衡基金 - A" */
export function parseUnitClass(name: string): { baseName: string; unitClass: string | null } {
  const match = name.match(/\s*[-–—\\-]+\s*(?:單位|Class)?\s*([A-Z0-9]+)\s*$/i);
  if (match) {
    const candidate = match[1].toUpperCase();
    if (candidate.length <= 2) {
      return {
        baseName: name.slice(0, match.index!).trim(),
        unitClass: candidate,
      };
    }
  }
  return { baseName: name, unitClass: null };
}

/**
 * Normalize base name by stripping trustee+scheme prefixes.
 * e.g. "宏利退休精選安聯大中華基金" → "安聯大中華基金" if schemeName is "退休精選" and trusteeName is "宏利"
 */
/** Common noise tokens that vary between data sources but don't distinguish funds */
const NOISE_TOKENS = ['MPF', '強積金', ' '];

function stripNoise(s: string): string {
  let out = s;
  // Strip "orientiert" prefix (old branding for AMTD funds)
  out = out.replace(/^orientiert/i, '');
  for (const tok of NOISE_TOKENS) {
    out = out.split(tok).join('');
  }
  return out;
}

function normalizeBaseName(baseName: string, fund: MpfFund): string {
  let normalized = baseName;
  const trustee = fund.trustee_name || '';
  const scheme = fund.scheme_name || '';

  // Try stripping "trustee + scheme" prefix (with or without spaces)
  if (trustee && scheme) {
    for (const sep of ['', ' ']) {
      const prefix = trustee + sep + scheme;
      if (normalized.startsWith(prefix)) {
        normalized = normalized.slice(prefix.length);
        break;
      }
    }
  }
  // Try stripping just scheme prefix  
  if (scheme && normalized.startsWith(scheme)) {
    normalized = normalized.slice(scheme.length);
  }
  // Try stripping just trustee prefix (with optional space)
  if (trustee) {
    if (normalized.startsWith(trustee + ' ')) {
      normalized = normalized.slice(trustee.length + 1);
    } else if (normalized.startsWith(trustee)) {
      normalized = normalized.slice(trustee.length);
    }
  }

  normalized = normalized.trim() || baseName;
  // Strip noise tokens (MPF, 強積金, spaces) for grouping key only
  return stripNoise(normalized);
}

export interface FundGroup {
  baseName: string;
  bestFund: MpfFund;
  variants: { fund: MpfFund; unitClass: string | null }[];
  hasMultiple: boolean;
}

/** Group funds by normalized base name, keeping the best-performing variant on top */
export function groupFundsByName(funds: MpfFund[], period: ReturnField): FundGroup[] {
  const map = new Map<string, { fund: MpfFund; unitClass: string | null; displayName: string }[]>();

  for (const fund of funds) {
    const displayName = fund.name_zh || fund.name;
    const { baseName, unitClass } = parseUnitClass(displayName);
    const normalizedKey = normalizeBaseName(baseName, fund);

    if (!map.has(normalizedKey)) map.set(normalizedKey, []);
    map.get(normalizedKey)!.push({ fund, unitClass, displayName: baseName });
  }

  const groups: FundGroup[] = [];
  for (const [, variants] of map) {
    variants.sort((a, b) => {
      const aValue = getFallbackReturn(a.fund, period)?.value ?? -Infinity;
      const bValue = getFallbackReturn(b.fund, period)?.value ?? -Infinity;
      return bValue - aValue;
    });

    const seen = new Map<string, typeof variants[0]>();
    const deduped: typeof variants = [];
    for (const v of variants) {
      const uc = v.unitClass || '__none__';
      const existing = seen.get(uc);
      if (!existing) {
        seen.set(uc, v);
        deduped.push(v);
      } else if (!existing.fund.name_zh && v.fund.name_zh) {
        const idx = deduped.indexOf(existing);
        deduped[idx] = v;
        seen.set(uc, v);
      }
    }

    const bestDisplayName = deduped.reduce((best, v) =>
      v.displayName.length < best.length ? v.displayName : best,
    deduped[0].displayName);

    groups.push({
      baseName: bestDisplayName,
      bestFund: deduped[0].fund,
      variants: deduped,
      hasMultiple: deduped.length > 1,
    });
  }

  groups.sort((a, b) => {
    const aValue = getFallbackReturn(a.bestFund, period)?.value ?? -Infinity;
    const bValue = getFallbackReturn(b.bestFund, period)?.value ?? -Infinity;
    return bValue - aValue;
  });
  return groups;
}

/**
 * Deduplicate funds by keeping only the best unit class per base fund name.
 * Returns a flat array of MpfFund with duplicates removed.
 */
export function deduplicateFunds(funds: MpfFund[], period: ReturnField): MpfFund[] {
  const groups = groupFundsByName(funds, period);
  return groups.map(g => g.bestFund);
}
