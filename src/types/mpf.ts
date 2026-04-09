export type FundCategory = '股票基金' | '債券基金' | '混合資產基金' | '貨幣市場基金' | '保證基金' | '預設投資策略';

export type TimePeriod = 'ytd' | '3m' | '1y' | '3y' | '5y' | '10y' | '2025' | '2024' | '2023' | '2022' | '2021';

export const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
  ytd: '年初至今',
  '3m': '3個月',
  '1y': '1年',
  '3y': '3年',
  '5y': '5年',
  '10y': '10年',
  '2025': '2025年',
  '2024': '2024年',
  '2023': '2023年',
  '2022': '2022年',
  '2021': '2021年',
};

export type FundSubCategory =
  | '環球股票' | '亞洲股票' | '香港股票' | '中國股票' | '北美股票' | '歐洲股票' | '其他股票'
  | '環球債券' | '亞洲債券' | '港元債券'
  | '混合資產-保守' | '混合資產-均衡' | '混合資產-進取'
  | '強積金保守' | '貨幣市場'
  | '保證基金'
  | '核心累積基金' | '65歲後基金';

export interface Fund {
  id: string;
  name: string;
  nameEn?: string;
  trustee: string;
  trusteePlan?: string;
  category: FundCategory;
  subCategory?: FundSubCategory;
  riskLevel: number; // 1-7
  managementFee: number; // FER percentage
  returns: Record<TimePeriod, number>; // percentage
  priceHistory: { date: string; price: number }[];
}

export interface Trustee {
  id: string;
  name: string;
}
