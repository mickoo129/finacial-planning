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
function normalizeBaseName(baseName: string, fund: MpfFund): string {
  let normalized = baseName;
  const trustee = fund.trustee_name || '';
  const scheme = fund.scheme_name || '';

  // Try stripping "trustee + scheme" prefix
  if (trustee && scheme) {
    const prefix = trustee + scheme;
    if (normalized.startsWith(prefix)) {
      normalized = normalized.slice(prefix.length);
    }
  }
  // Try stripping just scheme prefix  
  if (scheme && normalized.startsWith(scheme)) {
    normalized = normalized.slice(scheme.length);
  }
  // Try stripping just trustee prefix
  if (trustee && normalized.startsWith(trustee)) {
    normalized = normalized.slice(trustee.length);
  }

  return normalized || baseName;
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
  for (const [key, variants] of map) {
    // Sort variants by return descending
    variants.sort((a, b) => (b.fund[period] ?? -Infinity) - (a.fund[period] ?? -Infinity));

    // Deduplicate: if same unitClass appears multiple times (MPFA + ETNET), prefer MPFA (has name_zh)
    const seen = new Map<string, typeof variants[0]>();
    const deduped: typeof variants = [];
    for (const v of variants) {
      const uc = v.unitClass || '__none__';
      const existing = seen.get(uc);
      if (!existing) {
        seen.set(uc, v);
        deduped.push(v);
      } else {
        // Keep the one with more data (name_zh or fer)
        if (!existing.fund.name_zh && v.fund.name_zh) {
          const idx = deduped.indexOf(existing);
          deduped[idx] = v;
          seen.set(uc, v);
        }
      }
    }

    // Use the best display name (prefer shorter / MPFA name)
    const bestDisplayName = deduped.reduce((best, v) =>
      v.displayName.length < best.length ? v.displayName : best
    , deduped[0].displayName);

    groups.push({
      baseName: bestDisplayName,
      bestFund: deduped[0].fund,
      variants: deduped,
      hasMultiple: deduped.length > 1,
    });
  }

  groups.sort((a, b) => (b.bestFund[period] ?? -Infinity) - (a.bestFund[period] ?? -Infinity));
  return groups;
}
