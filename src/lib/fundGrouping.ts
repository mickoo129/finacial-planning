import type { MpfFund } from '@/hooks/useMpfFunds';
import type { ReturnField } from '@/lib/returnFields';

/** Extract base fund name and unit class from name like "安聯均衡基金 - 單位A" */
export function parseUnitClass(name: string): { baseName: string; unitClass: string | null } {
  // Match patterns like " - 單位A", " \- 單位T", " - Class A"
  const match = name.match(/\s*[-–—\\-]+\s*(單位|Class)\s*([A-Z0-9]+)\s*$/i);
  if (match) {
    return {
      baseName: name.slice(0, match.index!).trim(),
      unitClass: match[2],
    };
  }
  return { baseName: name, unitClass: null };
}

export interface FundGroup {
  baseName: string;
  bestFund: MpfFund;
  variants: { fund: MpfFund; unitClass: string | null }[];
  hasMultiple: boolean;
}

/** Group funds by base name, keeping the best-performing variant on top */
export function groupFundsByName(funds: MpfFund[], period: ReturnField): FundGroup[] {
  const map = new Map<string, { fund: MpfFund; unitClass: string | null }[]>();

  for (const fund of funds) {
    const displayName = fund.name_zh || fund.name;
    const { baseName, unitClass } = parseUnitClass(displayName);
    if (!map.has(baseName)) map.set(baseName, []);
    map.get(baseName)!.push({ fund, unitClass });
  }

  const groups: FundGroup[] = [];
  for (const [baseName, variants] of map) {
    // Sort variants by return descending
    variants.sort((a, b) => (b.fund[period] ?? -Infinity) - (a.fund[period] ?? -Infinity));
    groups.push({
      baseName,
      bestFund: variants[0].fund,
      variants,
      hasMultiple: variants.length > 1,
    });
  }

  // Sort groups by best fund return descending
  groups.sort((a, b) => (b.bestFund[period] ?? -Infinity) - (a.bestFund[period] ?? -Infinity));
  return groups;
}
