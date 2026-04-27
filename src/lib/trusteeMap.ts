// Maps etnet_plan_id to trustee name and scheme name
export const PLAN_TRUSTEE_MAP: Record<string, { trustee: string; scheme: string }> = {
  ETNSI1: { trustee: '銀聯信託', scheme: '積金之選' },
  ETNSI2: { trustee: '銀聯信託', scheme: '行業計劃' },
  ETNSI3: { trustee: '匯豐', scheme: 'SuperTrust Plus' },
  ETNSI4: { trustee: '宏利', scheme: '宏利強積金' },
  ETNSI5: { trustee: '友邦', scheme: '簡選計劃' },
  ETNSI6: { trustee: '永明', scheme: '強積金基本' },
  ETNSI7: { trustee: '中銀保誠', scheme: '強積金' },
  ETNSI8: { trustee: '交通銀行', scheme: '強積金計劃' },
  ETNSI9: { trustee: '東亞', scheme: '強積金' },
  ETNSI10: { trustee: '富達', scheme: '退休集成' },
  ETNSI11: { trustee: '信安', scheme: '強積金' },
  ETNSI12: { trustee: '景順', scheme: '策略計劃' },
  ETNSI13: { trustee: 'BCT', scheme: '積金之選' },
  ETNSI14: { trustee: '萬通', scheme: '強積金' },
  ETNSI15: { trustee: '海通', scheme: 'MPF計劃' },
  ETNSI16: { trustee: '匯豐', scheme: '智選計劃' },
  ETNSI17: { trustee: '恒生', scheme: '強積金' },
  ETNSI18: { trustee: '中國人壽', scheme: '強積金' },
  ETNSI19: { trustee: '銀聯信託', scheme: 'AMTD強積金計劃' },
  ETNSI20: { trustee: '宏利', scheme: '全面之選' },
  ETNSI21: { trustee: '宏利', scheme: '環球精選' },
  ETNSI22: { trustee: '友邦', scheme: '尊選計劃' },
  ETNSI23: { trustee: '永明', scheme: '強積金集成' },
  ETNSI24: { trustee: '中銀保誠', scheme: '我的強積金' },
  ETNSI25: { trustee: '信安', scheme: '800系列' },
  ETNSI26: { trustee: '交通銀行', scheme: '愉盈退休' },
  ETNSI27: { trustee: 'BCT', scheme: '行業計劃' },
  ETNSI28: { trustee: '富達', scheme: '退休集成' },
  ETNSI29: { trustee: '景順', scheme: '強積金' },
  ETNSI30: { trustee: '恒生', scheme: '自選計劃' },
  ETNSI31: { trustee: '友邦', scheme: '優選計劃' },
  ETNSI32: { trustee: '永明', scheme: '彩虹計劃' },
  ETNSI33: { trustee: '永明', scheme: '彩虹計劃' },
  ETNSI34: { trustee: '中銀保誠', scheme: '簡易強積金' },
  ETNSI35: { trustee: '中銀保誠', scheme: '我的強積金' },
  ETNSI36: { trustee: '宏利', scheme: '退休精選' },
  ETNSI37: { trustee: '海通', scheme: 'MPF計劃' },
  ETNSI38: { trustee: '銀聯信託', scheme: '積金之選' },
  ETNSI39: { trustee: '銀聯信託', scheme: '策略計劃' },
  ETNSI40: { trustee: '東亞', scheme: '集成信託' },
  ETNSI41: { trustee: '東亞', scheme: '強積金計劃' },
  ETNSI42: { trustee: '東亞', scheme: '集成信託' },
  ETNSI43: { trustee: '東亞', scheme: '行業計劃' },
  ETNSI44: { trustee: '銀聯信託', scheme: 'AMTD強積金計劃' },
  ETNSI45: { trustee: '中國人壽', scheme: '強積金計劃' },
  ETNSI46: { trustee: 'BCT', scheme: '積金之選' },
  ETNSI47: { trustee: '恒生', scheme: '智選計劃' },
  ETNSI48: { trustee: '匯豐', scheme: '精選計劃' },
  ETNSI49: { trustee: '景順', scheme: '策略計劃' },
  ETNSI50: { trustee: '富達', scheme: '退休集成' },
  ETNSI51: { trustee: '萬通', scheme: '僱員自選' },
  ETNSI52: { trustee: '宏利', scheme: '退休精選' },
  ETNSI53: { trustee: '萬通', scheme: '萬全計劃' },
  ETNSI54: { trustee: '信安', scheme: '智選計劃' },
  ETNSI55: { trustee: '友邦', scheme: '永明MPF' },
  ETNSI56: { trustee: '海通', scheme: 'MPF退休金' },
  ETNSI57: { trustee: '銀聯信託', scheme: '強積金' },
  ETNSI58: { trustee: 'BCT', scheme: '（強積金）行業計劃' },
  ETNSI59: { trustee: '中銀保誠', scheme: '強積金計劃' },
  ETNSI60: { trustee: '東亞', scheme: '享惠計劃' },
  ETNSI61: { trustee: '宏利', scheme: '強積金計劃' },
  ETNSI62: { trustee: '匯豐', scheme: '強積金計劃' },
  ETNSI63: { trustee: '友邦', scheme: '強積金計劃' },
  ETNSI64: { trustee: '永明', scheme: '強積金計劃' },
  ETNSI65: { trustee: '信安', scheme: '明智之選' },
  ETNSI66: { trustee: '信安', scheme: '易富之選' },
};

// Normalize trustee names to match MPFA official approved trustee list
// Reference: https://www.mpfa.org.hk/sc/info-centre/public-registers/mpf-approved-trustees
// MPFA 截至 2026 年現有核准受託人約 12 間，部分品牌名實際隸屬同一受託人法人
const TRUSTEE_ALIAS: Record<string, string> = {
  // AMTD 強積金計劃受託人為「銀聯信託有限公司」
  'AMTD': '銀聯信託',
  // 新鴻基 MPF 僱主自選計劃受託人為「銀聯信託」
  '新鴻基': '銀聯信託',
  // 恒生強積金由「滙豐機構信託服務（亞洲）」擔任受託人
  '恒生': '滙豐',
  // 「匯豐」與「滙豐」統一為官方繁體寫法
  '匯豐': '滙豐',
  // 海通 MPF 退休金計劃自 2024 年起由「渣打信託（香港）」接手做受託人，
  // 「海通」只係保薦人/品牌名，唔係 MPFA 核准受託人
  '海通': '渣打信託',
};

// MPFA 官方 13 個現有核准受託人顯示名稱（用於檢查 / 完整列表）
// 來源：https://www.mpfa.org.hk/sc/info-centre/public-registers/mpf-approved-trustees
export const MPFA_APPROVED_TRUSTEES = [
  '東亞',
  '友邦',
  '銀聯信託',
  '交通銀行',
  '中銀保誠',
  '中國人壽',
  '滙豐',
  '宏利',
  '信安',
  '渣打信託',
  '永明',
  '萬通',
  '富達',
  '景順',
  'BCT',
];

// Infer trustee from fund name when trustee_name is null/missing
const FUND_NAME_TRUSTEE_PATTERNS: { pattern: RegExp; trustee: string; scheme: string }[] = [
  { pattern: /AMTD/i, trustee: '銀聯信託', scheme: 'AMTD強積金計劃' },
  { pattern: /新鴻基|新鸿基/i, trustee: '銀聯信託', scheme: '新鴻基強積金僱主自選計劃' },
  { pattern: /海通/i, trustee: '渣打信託', scheme: '海通MPF退休金計劃' },
  { pattern: /恒生/i, trustee: '滙豐', scheme: '恒生強積金智選計劃' },
  { pattern: /匯豐|滙豐|HSBC/i, trustee: '滙豐', scheme: '滙豐強積金智選計劃' },
];

export function normalizeTrusteeName(name: string | null | undefined): string {
  if (!name) return '未知';
  return TRUSTEE_ALIAS[name] || name;
}

/**
 * Resolve trustee for a fund using all available signals:
 * 1. trustee_name (with alias normalization)
 * 2. etnet_plan_id mapping
 * 3. Fund name pattern matching (for corrupted/missing data)
 */
export function resolveTrustee(fund: { trustee_name?: string | null; etnet_plan_id?: string | null; name?: string; name_zh?: string | null }): string {
  // 1. Check trustee_name with alias
  if (fund.trustee_name) {
    const normalized = TRUSTEE_ALIAS[fund.trustee_name] || fund.trustee_name;
    if (normalized !== '未知') return normalized;
  }
  // 2. Check plan ID mapping
  if (fund.etnet_plan_id && PLAN_TRUSTEE_MAP[fund.etnet_plan_id]) {
    return PLAN_TRUSTEE_MAP[fund.etnet_plan_id].trustee;
  }
  // 3. Infer from fund name
  const fundName = fund.name_zh || fund.name || '';
  for (const { pattern, trustee } of FUND_NAME_TRUSTEE_PATTERNS) {
    if (pattern.test(fundName)) return trustee;
  }
  return '未知';
}

/**
 * Resolve scheme for a fund using all available signals
 */
export function resolveScheme(fund: { scheme_name?: string | null; etnet_plan_id?: string | null; name?: string; name_zh?: string | null }): string {
  if (fund.scheme_name) return fund.scheme_name;
  if (fund.etnet_plan_id && PLAN_TRUSTEE_MAP[fund.etnet_plan_id]) {
    return PLAN_TRUSTEE_MAP[fund.etnet_plan_id].scheme;
  }
  const fundName = fund.name_zh || fund.name || '';
  for (const { pattern, scheme } of FUND_NAME_TRUSTEE_PATTERNS) {
    if (pattern.test(fundName)) return scheme;
  }
  return '未知';
}

export function getTrusteeFromPlanId(planId: string | null): string {
  if (!planId) return '未知';
  return PLAN_TRUSTEE_MAP[planId]?.trustee || '其他';
}

export function getSchemeFromPlanId(planId: string | null): string {
  if (!planId) return '未知';
  return PLAN_TRUSTEE_MAP[planId]?.scheme || '其他';
}

export function getAllTrustees(): string[] {
  const trustees = new Set<string>();
  Object.values(PLAN_TRUSTEE_MAP).forEach(v => trustees.add(v.trustee));
  return Array.from(trustees).sort();
}
