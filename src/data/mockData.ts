import { Fund, Trustee, FundCategory } from '@/types/mpf';

export const TRUSTEES: Trustee[] = [
  { id: 't1', name: '宏利' },
  { id: 't2', name: '永明' },
  { id: 't3', name: '匯豐' },
  { id: 't4', name: '友邦' },
  { id: 't5', name: '中銀保誠' },
  { id: 't6', name: '富達' },
  { id: 't7', name: '信安' },
  { id: 't8', name: '東亞' },
  { id: 't9', name: '景順' },
  { id: 't10', name: 'BCT銀聯' },
  { id: 't11', name: '交通銀行' },
  { id: 't12', name: '萬全' },
];

function generatePriceHistory(basePrice: number, volatility: number, trend: number): { date: string; price: number }[] {
  const history: { date: string; price: number }[] = [];
  let price = basePrice * 0.5;
  const today = new Date();
  for (let i = 3650; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    price *= 1 + (trend / 365) + (Math.random() - 0.48) * volatility / 100;
    if (price < 0.5) price = 0.5;
    history.push({ date: d.toISOString().slice(0, 10), price: Math.round(price * 1000) / 1000 });
  }
  return history;
}

function calcReturns(history: { date: string; price: number }[]) {
  const latest = history[history.length - 1].price;
  const get = (daysAgo: number) => {
    const idx = Math.max(0, history.length - 1 - daysAgo);
    return history[idx].price;
  };
  const today = new Date(history[history.length - 1].date);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const daysInMonth = Math.floor((today.getTime() - startOfMonth.getTime()) / 86400000);
  const daysInYear = Math.floor((today.getTime() - startOfYear.getTime()) / 86400000);

  const r = (prev: number) => Math.round(((latest - prev) / prev) * 10000) / 100;
  return {
    daily: r(get(1)),
    weekly: r(get(7)),
    monthly: r(get(30)),
    mtd: r(get(Math.max(1, daysInMonth))),
    ytd: r(get(Math.max(1, daysInYear))),
    '3m': r(get(90)),
    '6m': r(get(180)),
    '1y': r(get(365)),
    '3y': r(get(1095)),
    '5y': r(get(1825)),
    '10y': r(get(3650)),
  };
}

interface FundTemplate {
  name: string;
  trustee: string;
  trusteeId: string;
  category: FundCategory;
  risk: number;
  fee: number;
  basePrice: number;
  volatility: number;
  trend: number;
}

const templates: FundTemplate[] = [
  // 宏利
  { name: '宏利MPF環球股票基金', trustee: '宏利', trusteeId: 't1', category: '股票基金', risk: 6, fee: 1.74, basePrice: 25, volatility: 1.8, trend: 0.08 },
  { name: '宏利MPF中華威力基金', trustee: '宏利', trusteeId: 't1', category: '股票基金', risk: 6, fee: 1.81, basePrice: 18, volatility: 2.2, trend: 0.04 },
  { name: '宏利MPF穩健基金', trustee: '宏利', trusteeId: 't1', category: '混合資產基金', risk: 4, fee: 1.67, basePrice: 15, volatility: 0.8, trend: 0.05 },
  { name: '宏利MPF利息基金', trustee: '宏利', trusteeId: 't1', category: '債券基金', risk: 2, fee: 1.28, basePrice: 12, volatility: 0.3, trend: 0.02 },
  { name: '宏利MPF核心累積基金', trustee: '宏利', trusteeId: 't1', category: '預設投資策略', risk: 5, fee: 0.75, basePrice: 12, volatility: 1.2, trend: 0.06 },
  // 永明
  { name: '永明彩虹強積金環球股票基金', trustee: '永明', trusteeId: 't2', category: '股票基金', risk: 6, fee: 1.68, basePrice: 22, volatility: 1.6, trend: 0.09 },
  { name: '永明彩虹強積金香港股票基金', trustee: '永明', trusteeId: 't2', category: '股票基金', risk: 6, fee: 1.53, basePrice: 16, volatility: 2.0, trend: 0.03 },
  { name: '永明彩虹強積金平衡基金', trustee: '永明', trusteeId: 't2', category: '混合資產基金', risk: 4, fee: 1.62, basePrice: 14, volatility: 0.9, trend: 0.05 },
  { name: '永明彩虹強積金債券基金', trustee: '永明', trusteeId: 't2', category: '債券基金', risk: 3, fee: 1.15, basePrice: 11, volatility: 0.4, trend: 0.025 },
  { name: '永明強積金核心累積基金', trustee: '永明', trusteeId: 't2', category: '預設投資策略', risk: 5, fee: 0.75, basePrice: 11, volatility: 1.1, trend: 0.065 },
  // 匯豐
  { name: '匯豐強積金北美股票基金', trustee: '匯豐', trusteeId: 't3', category: '股票基金', risk: 6, fee: 1.54, basePrice: 28, volatility: 1.7, trend: 0.10 },
  { name: '匯豐強積金亞太股票基金', trustee: '匯豐', trusteeId: 't3', category: '股票基金', risk: 6, fee: 1.58, basePrice: 17, volatility: 1.9, trend: 0.05 },
  { name: '匯豐強積金均衡基金', trustee: '匯豐', trusteeId: 't3', category: '混合資產基金', risk: 4, fee: 1.55, basePrice: 16, volatility: 0.85, trend: 0.055 },
  { name: '匯豐強積金保守基金', trustee: '匯豐', trusteeId: 't3', category: '貨幣市場基金', risk: 1, fee: 0.79, basePrice: 11, volatility: 0.05, trend: 0.005 },
  { name: '匯豐強積金核心累積基金', trustee: '匯豐', trusteeId: 't3', category: '預設投資策略', risk: 5, fee: 0.75, basePrice: 12, volatility: 1.15, trend: 0.07 },
  // 友邦
  { name: '友邦強積金歐洲股票基金', trustee: '友邦', trusteeId: 't4', category: '股票基金', risk: 6, fee: 1.76, basePrice: 20, volatility: 1.8, trend: 0.07 },
  { name: '友邦強積金中港股票基金', trustee: '友邦', trusteeId: 't4', category: '股票基金', risk: 6, fee: 1.65, basePrice: 15, volatility: 2.3, trend: 0.02 },
  { name: '友邦強積金均衡組合', trustee: '友邦', trusteeId: 't4', category: '混合資產基金', risk: 4, fee: 1.60, basePrice: 14, volatility: 0.9, trend: 0.05 },
  { name: '友邦強積金亞洲債券基金', trustee: '友邦', trusteeId: 't4', category: '債券基金', risk: 3, fee: 1.22, basePrice: 12, volatility: 0.45, trend: 0.03 },
  { name: '友邦核心累積基金', trustee: '友邦', trusteeId: 't4', category: '預設投資策略', risk: 5, fee: 0.75, basePrice: 11, volatility: 1.2, trend: 0.06 },
  // 中銀保誠
  { name: '中銀保誠環球股票基金', trustee: '中銀保誠', trusteeId: 't5', category: '股票基金', risk: 6, fee: 1.60, basePrice: 24, volatility: 1.65, trend: 0.085 },
  { name: '中銀保誠中國股票基金', trustee: '中銀保誠', trusteeId: 't5', category: '股票基金', risk: 7, fee: 1.70, basePrice: 14, volatility: 2.5, trend: 0.01 },
  { name: '中銀保誠平穩基金', trustee: '中銀保誠', trusteeId: 't5', category: '混合資產基金', risk: 3, fee: 1.50, basePrice: 13, volatility: 0.7, trend: 0.04 },
  { name: '中銀保誠債券基金', trustee: '中銀保誠', trusteeId: 't5', category: '債券基金', risk: 2, fee: 1.10, basePrice: 11, volatility: 0.35, trend: 0.02 },
  { name: '中銀保誠核心累積基金', trustee: '中銀保誠', trusteeId: 't5', category: '預設投資策略', risk: 5, fee: 0.75, basePrice: 12, volatility: 1.1, trend: 0.065 },
  // 富達
  { name: '富達環球投資基金', trustee: '富達', trusteeId: 't6', category: '股票基金', risk: 6, fee: 1.55, basePrice: 26, volatility: 1.5, trend: 0.09 },
  { name: '富達增長基金', trustee: '富達', trusteeId: 't6', category: '混合資產基金', risk: 5, fee: 1.58, basePrice: 18, volatility: 1.1, trend: 0.06 },
  { name: '富達穩定資本基金', trustee: '富達', trusteeId: 't6', category: '債券基金', risk: 2, fee: 1.15, basePrice: 11, volatility: 0.3, trend: 0.02 },
  { name: '富達保守基金', trustee: '富達', trusteeId: 't6', category: '貨幣市場基金', risk: 1, fee: 0.70, basePrice: 10.5, volatility: 0.04, trend: 0.004 },
  { name: '富達核心累積基金', trustee: '富達', trusteeId: 't6', category: '預設投資策略', risk: 5, fee: 0.75, basePrice: 12, volatility: 1.2, trend: 0.068 },
  // 信安
  { name: '信安環球股票基金', trustee: '信安', trusteeId: 't7', category: '股票基金', risk: 6, fee: 1.62, basePrice: 23, volatility: 1.6, trend: 0.082 },
  { name: '信安香港股票基金', trustee: '信安', trusteeId: 't7', category: '股票基金', risk: 6, fee: 1.55, basePrice: 15, volatility: 2.1, trend: 0.03 },
  { name: '信安平衡基金', trustee: '信安', trusteeId: 't7', category: '混合資產基金', risk: 4, fee: 1.50, basePrice: 14, volatility: 0.85, trend: 0.048 },
  { name: '信安保證基金', trustee: '信安', trusteeId: 't7', category: '保證基金', risk: 2, fee: 1.80, basePrice: 12, volatility: 0.15, trend: 0.015 },
  { name: '信安核心累積基金', trustee: '信安', trusteeId: 't7', category: '預設投資策略', risk: 5, fee: 0.75, basePrice: 11.5, volatility: 1.15, trend: 0.062 },
  // 東亞
  { name: '東亞環球增長基金', trustee: '東亞', trusteeId: 't8', category: '股票基金', risk: 6, fee: 1.70, basePrice: 21, volatility: 1.7, trend: 0.075 },
  { name: '東亞大中華股票基金', trustee: '東亞', trusteeId: 't8', category: '股票基金', risk: 7, fee: 1.72, basePrice: 13, volatility: 2.4, trend: 0.015 },
  { name: '東亞均衡基金', trustee: '東亞', trusteeId: 't8', category: '混合資產基金', risk: 4, fee: 1.58, basePrice: 13, volatility: 0.9, trend: 0.045 },
  { name: '東亞保守基金', trustee: '東亞', trusteeId: 't8', category: '貨幣市場基金', risk: 1, fee: 0.85, basePrice: 10.8, volatility: 0.05, trend: 0.005 },
  { name: '東亞核心累積基金', trustee: '東亞', trusteeId: 't8', category: '預設投資策略', risk: 5, fee: 0.75, basePrice: 11.5, volatility: 1.1, trend: 0.06 },
  // 景順
  { name: '景順環球股票基金', trustee: '景順', trusteeId: 't9', category: '股票基金', risk: 6, fee: 1.52, basePrice: 27, volatility: 1.55, trend: 0.095 },
  { name: '景順亞洲股票基金', trustee: '景順', trusteeId: 't9', category: '股票基金', risk: 6, fee: 1.58, basePrice: 16, volatility: 1.9, trend: 0.045 },
  { name: '景順平穩增長基金', trustee: '景順', trusteeId: 't9', category: '混合資產基金', risk: 4, fee: 1.48, basePrice: 15, volatility: 0.8, trend: 0.052 },
  { name: '景順環球債券基金', trustee: '景順', trusteeId: 't9', category: '債券基金', risk: 3, fee: 1.12, basePrice: 11.5, volatility: 0.38, trend: 0.025 },
  { name: '景順核心累積基金', trustee: '景順', trusteeId: 't9', category: '預設投資策略', risk: 5, fee: 0.75, basePrice: 12, volatility: 1.18, trend: 0.068 },
  // BCT銀聯
  { name: 'BCT環球股票基金', trustee: 'BCT銀聯', trusteeId: 't10', category: '股票基金', risk: 6, fee: 1.45, basePrice: 24, volatility: 1.6, trend: 0.088 },
  { name: 'BCT中國及香港股票基金', trustee: 'BCT銀聯', trusteeId: 't10', category: '股票基金', risk: 7, fee: 1.50, basePrice: 13, volatility: 2.3, trend: 0.02 },
  { name: 'BCT均衡基金', trustee: 'BCT銀聯', trusteeId: 't10', category: '混合資產基金', risk: 4, fee: 1.42, basePrice: 14, volatility: 0.85, trend: 0.05 },
  { name: 'BCT環球債券基金', trustee: 'BCT銀聯', trusteeId: 't10', category: '債券基金', risk: 3, fee: 1.08, basePrice: 11, volatility: 0.35, trend: 0.022 },
  { name: 'BCT核心累積基金', trustee: 'BCT銀聯', trusteeId: 't10', category: '預設投資策略', risk: 5, fee: 0.75, basePrice: 12, volatility: 1.12, trend: 0.065 },
  // 交通銀行
  { name: '交銀環球股票基金', trustee: '交通銀行', trusteeId: 't11', category: '股票基金', risk: 6, fee: 1.58, basePrice: 22, volatility: 1.65, trend: 0.08 },
  { name: '交銀中國動力股票基金', trustee: '交通銀行', trusteeId: 't11', category: '股票基金', risk: 7, fee: 1.65, basePrice: 12, volatility: 2.5, trend: 0.01 },
  { name: '交銀均衡基金', trustee: '交通銀行', trusteeId: 't11', category: '混合資產基金', risk: 4, fee: 1.52, basePrice: 13, volatility: 0.88, trend: 0.048 },
  { name: '交銀保證基金', trustee: '交通銀行', trusteeId: 't11', category: '保證基金', risk: 2, fee: 1.85, basePrice: 11.5, volatility: 0.12, trend: 0.012 },
  { name: '交銀核心累積基金', trustee: '交通銀行', trusteeId: 't11', category: '預設投資策略', risk: 5, fee: 0.75, basePrice: 11.5, volatility: 1.1, trend: 0.06 },
  // 萬全
  { name: '萬全環球股票基金', trustee: '萬全', trusteeId: 't12', category: '股票基金', risk: 6, fee: 1.48, basePrice: 23, volatility: 1.55, trend: 0.086 },
  { name: '萬全香港股票基金', trustee: '萬全', trusteeId: 't12', category: '股票基金', risk: 6, fee: 1.52, basePrice: 14, volatility: 2.1, trend: 0.028 },
  { name: '萬全均衡基金', trustee: '萬全', trusteeId: 't12', category: '混合資產基金', risk: 4, fee: 1.45, basePrice: 14, volatility: 0.82, trend: 0.05 },
  { name: '萬全環球債券基金', trustee: '萬全', trusteeId: 't12', category: '債券基金', risk: 3, fee: 1.05, basePrice: 11, volatility: 0.32, trend: 0.02 },
  { name: '萬全核心累積基金', trustee: '萬全', trusteeId: 't12', category: '預設投資策略', risk: 5, fee: 0.75, basePrice: 12, volatility: 1.15, trend: 0.066 },
];

let fundsCache: Fund[] | null = null;

export function getAllFunds(): Fund[] {
  if (fundsCache) return fundsCache;
  fundsCache = templates.map((t, i) => {
    const history = generatePriceHistory(t.basePrice, t.volatility, t.trend);
    return {
      id: `f${i + 1}`,
      name: t.name,
      trustee: t.trustee,
      category: t.category,
      riskLevel: t.risk,
      managementFee: t.fee,
      returns: calcReturns(history),
      priceHistory: history,
    };
  });
  return fundsCache;
}

export function getFundById(id: string): Fund | undefined {
  return getAllFunds().find(f => f.id === id);
}

export function getFundsByTrustee(trusteeName: string): Fund[] {
  return getAllFunds().filter(f => f.trustee === trusteeName);
}

export function getTopFunds(period: keyof Fund['returns'], count: number = 10): Fund[] {
  return [...getAllFunds()].sort((a, b) => b.returns[period] - a.returns[period]).slice(0, count);
}

export function getBottomFunds(period: keyof Fund['returns'], count: number = 10): Fund[] {
  return [...getAllFunds()].sort((a, b) => a.returns[period] - b.returns[period]).slice(0, count);
}

export function getCategories(): string[] {
  return [...new Set(getAllFunds().map(f => f.category))];
}

export function getFundsByCategory(category: string): Fund[] {
  return getAllFunds().filter(f => f.category === category);
}
