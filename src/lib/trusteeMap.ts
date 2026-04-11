// Maps etnet_plan_id to trustee name and scheme name
export const PLAN_TRUSTEE_MAP: Record<string, { trustee: string; scheme: string }> = {
  ETNSI1: { trustee: '銀聯信託', scheme: '積金之選' },
  ETNSI2: { trustee: '銀聯信託', scheme: '行業計劃' },
  ETNSI16: { trustee: '匯豐', scheme: '智選計劃' },
  ETNSI21: { trustee: '宏利', scheme: '環球精選' },
  ETNSI25: { trustee: '信安', scheme: '800系列' },
  ETNSI26: { trustee: '交通銀行', scheme: '愉盈退休' },
  ETNSI31: { trustee: '友邦', scheme: '優選計劃' },
  ETNSI33: { trustee: '永明', scheme: '彩虹計劃' },
  ETNSI34: { trustee: '中銀保誠', scheme: '簡易強積金' },
  ETNSI35: { trustee: '中銀保誠', scheme: '我的強積金' },
  ETNSI37: { trustee: '海通', scheme: 'MPF計劃' },
  ETNSI39: { trustee: '銀聯信託', scheme: '策略計劃' },
  ETNSI42: { trustee: '東亞', scheme: '集成信託' },
  ETNSI43: { trustee: '東亞', scheme: '行業計劃' },
  ETNSI44: { trustee: 'AMTD', scheme: '強積金計劃' },
  ETNSI45: { trustee: '中國人壽', scheme: '強積金計劃' },
  ETNSI47: { trustee: '恒生', scheme: '智選計劃' },
  ETNSI50: { trustee: '富達', scheme: '退休集成' },
  ETNSI52: { trustee: '宏利', scheme: '退休精選' },
  ETNSI53: { trustee: '萬通', scheme: '萬全計劃' },
  ETNSI60: { trustee: '東亞', scheme: '享惠計劃' },
  ETNSI65: { trustee: '信安', scheme: '明智之選' },
  ETNSI66: { trustee: '信安', scheme: '易富之選' },
};

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
