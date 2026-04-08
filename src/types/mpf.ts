export type FundCategory = '股票基金' | '債券基金' | '混合資產基金' | '貨幣市場基金' | '保證基金' | '預設投資策略';

export type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'mtd' | 'ytd' | '3m' | '6m' | '1y' | '3y' | '5y' | '10y';

export const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
  daily: '每日',
  weekly: '每週',
  monthly: '每月',
  mtd: '月至今',
  ytd: '年至今',
  '3m': '3個月',
  '6m': '6個月',
  '1y': '1年',
  '3y': '3年',
  '5y': '5年',
  '10y': '10年',
};

export interface Fund {
  id: string;
  name: string;
  trustee: string;
  category: FundCategory;
  riskLevel: number; // 1-7
  managementFee: number; // percentage
  returns: Record<TimePeriod, number>; // percentage
  priceHistory: { date: string; price: number }[];
}

export interface Trustee {
  id: string;
  name: string;
}
