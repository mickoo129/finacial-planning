// RADAR 量化評分系統 - 基於同類別百分位排名 + 多週期表現 + 成本規模

export type Signal = 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';

export interface ScoredFund {
  fund: any;
  score: number;
  signal: Signal;
  // 子分數 (0-100)
  longTerm: number;      // 長期回報 (5y/10y 同類百分位)
  bearMarket: number;    // 熊市抗跌 (2022 表現相對同類)
  consistency: number;   // 一致性 (年度正回報年數 + 波動)
  costEff: number;       // 成本效益 (FER 相對同類)
  sizeStab: number;      // 規模穩定性 (fund_size)
  // 用於展示嘅實際數值
  metrics: {
    rank5y?: number;        // 5年同類百分位排名 (0-100, 100=最好)
    rank10y?: number;
    return5y?: number | null;
    return10y?: number | null;
    return2022?: number | null;
    bear2022Diff?: number;  // vs 同類平均
    positiveYears?: number; // 過去5年正回報年數
    totalYears?: number;
    volatility?: number;    // 年度回報標準差
    fer?: number | null;
    ferRank?: number;       // 0-100, 100=費用最低
    fundSize?: number | null;
  };
}

interface PeerStats {
  return5y: number[];
  return10y: number[];
  return2022: number[];
  fer: number[];
}

function percentileRank(value: number | null | undefined, sortedAsc: number[]): number | undefined {
  if (value == null || sortedAsc.length === 0) return undefined;
  let count = 0;
  for (const v of sortedAsc) if (v < value) count++;
  return Math.round((count / sortedAsc.length) * 100);
}

function buildPeerStats(funds: any[]): Map<string, PeerStats> {
  const map = new Map<string, PeerStats>();
  for (const f of funds) {
    const key = f.sub_category || f.category || '其他';
    if (!map.has(key)) map.set(key, { return5y: [], return10y: [], return2022: [], fer: [] });
    const s = map.get(key)!;
    if (f.return_5y != null) s.return5y.push(f.return_5y);
    if (f.return_10y != null) s.return10y.push(f.return_10y);
    if (f.return_2022 != null) s.return2022.push(f.return_2022);
    if (f.fer != null) s.fer.push(f.fer);
  }
  for (const s of map.values()) {
    s.return5y.sort((a, b) => a - b);
    s.return10y.sort((a, b) => a - b);
    s.return2022.sort((a, b) => a - b);
    s.fer.sort((a, b) => a - b);
  }
  return map;
}

function avg(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function stddev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = avg(arr);
  return Math.sqrt(avg(arr.map(x => (x - m) ** 2)));
}

export function scoreFund(fund: any, peerStats: Map<string, PeerStats>): ScoredFund {
  const key = fund.sub_category || fund.category || '其他';
  const peers = peerStats.get(key);

  // 長期回報：5y 百分位 70% + 10y 百分位 30%
  const rank5y = peers ? percentileRank(fund.return_5y, peers.return5y) : undefined;
  const rank10y = peers ? percentileRank(fund.return_10y, peers.return10y) : undefined;
  let longTerm: number;
  if (rank5y != null && rank10y != null) longTerm = rank5y * 0.7 + rank10y * 0.3;
  else if (rank5y != null) longTerm = rank5y;
  else if (rank10y != null) longTerm = rank10y;
  else longTerm = 50;

  // 熊市抗跌：2022 表現 vs 同類平均
  let bearMarket = 50;
  let bear2022Diff = 0;
  if (fund.return_2022 != null && peers && peers.return2022.length > 0) {
    const peerAvg = avg(peers.return2022);
    bear2022Diff = fund.return_2022 - peerAvg;
    // 跌少 5% 以上 = 80+，跌多 5% 以上 = 20-
    bearMarket = Math.min(100, Math.max(0, 50 + bear2022Diff * 6));
  }

  // 一致性：正回報年數 + 波動率
  const yearlyReturns = [fund.return_2021, fund.return_2022, fund.return_2023, fund.return_2024, fund.return_2025]
    .filter(r => r != null) as number[];
  const positiveYears = yearlyReturns.filter(r => r > 0).length;
  const totalYears = yearlyReturns.length;
  const volatility = stddev(yearlyReturns);
  let consistency = 50;
  if (totalYears >= 3) {
    const positiveRatio = positiveYears / totalYears;
    // 波動率：低 (<5) 加分，高 (>20) 扣分
    const volScore = Math.max(0, 100 - volatility * 4);
    consistency = positiveRatio * 60 + volScore * 0.4;
  }

  // 成本效益：FER 同類排名（越低越好，所以反轉）
  let costEff = 50;
  let ferRank: number | undefined;
  if (fund.fer != null && peers && peers.fer.length > 0) {
    const rank = percentileRank(fund.fer, peers.fer) ?? 50;
    ferRank = 100 - rank;
    costEff = ferRank;
  }

  // 規模穩定性：>1000M = 90, >500 = 75, >100 = 60, >50 = 45, <50 = 25
  let sizeStab = 50;
  if (fund.fund_size != null) {
    const s = fund.fund_size;
    sizeStab = s >= 1000 ? 90 : s >= 500 ? 75 : s >= 100 ? 60 : s >= 50 ? 45 : 25;
  }

  // 綜合：長期 35% + 熊市 20% + 一致性 20% + 成本 15% + 規模 10%
  const score = Math.round(
    longTerm * 0.35 + bearMarket * 0.20 + consistency * 0.20 + costEff * 0.15 + sizeStab * 0.10
  );

  let signal: Signal;
  if (score >= 75) signal = 'strong_buy';
  else if (score >= 62) signal = 'buy';
  else if (score >= 45) signal = 'hold';
  else if (score >= 32) signal = 'sell';
  else signal = 'strong_sell';

  return {
    fund,
    score,
    signal,
    longTerm: Math.round(longTerm),
    bearMarket: Math.round(bearMarket),
    consistency: Math.round(consistency),
    costEff: Math.round(costEff),
    sizeStab: Math.round(sizeStab),
    metrics: {
      rank5y, rank10y,
      return5y: fund.return_5y, return10y: fund.return_10y,
      return2022: fund.return_2022,
      bear2022Diff: Math.round(bear2022Diff * 10) / 10,
      positiveYears, totalYears,
      volatility: Math.round(volatility * 10) / 10,
      fer: fund.fer, ferRank,
      fundSize: fund.fund_size,
    },
  };
}

export function buildScoredFunds(funds: any[]): ScoredFund[] {
  const peerStats = buildPeerStats(funds);
  return funds.map(f => scoreFund(f, peerStats));
}

export function buildReasons(s: ScoredFund): string[] {
  const r: string[] = [];
  const m = s.metrics;

  // 長期回報
  if (m.rank5y != null && m.rank5y >= 75 && m.return5y != null) {
    r.push(`5年回報 ${m.return5y.toFixed(1)}%，排同類前 ${100 - m.rank5y}%`);
  } else if (m.rank5y != null && m.rank5y <= 25 && m.return5y != null) {
    r.push(`5年回報 ${m.return5y.toFixed(1)}%，排同類後 ${m.rank5y}%`);
  } else if (m.return5y != null && m.rank5y != null) {
    r.push(`5年回報 ${m.return5y.toFixed(1)}%（同類中游）`);
  }

  if (m.rank10y != null && m.rank10y >= 75 && m.return10y != null) {
    r.push(`10年回報 ${m.return10y.toFixed(1)}% 跑贏同類`);
  }

  // 熊市
  if (m.return2022 != null && m.bear2022Diff != null) {
    if (m.bear2022Diff >= 3) r.push(`2022 熊市跌 ${Math.abs(m.return2022).toFixed(1)}%，比同類少跌 ${m.bear2022Diff.toFixed(1)}%`);
    else if (m.bear2022Diff <= -3) r.push(`2022 熊市跌 ${Math.abs(m.return2022).toFixed(1)}%，比同類多跌 ${Math.abs(m.bear2022Diff).toFixed(1)}%`);
  }

  // 一致性
  if (m.totalYears && m.positiveYears != null) {
    if (m.positiveYears >= 4) r.push(`過去 ${m.totalYears} 年有 ${m.positiveYears} 年正回報`);
    else if (m.positiveYears <= 1) r.push(`過去 ${m.totalYears} 年僅 ${m.positiveYears} 年正回報`);
  }
  if (m.volatility != null && m.volatility > 15) r.push(`年度回報波幅大（標準差 ${m.volatility}%）`);
  else if (m.volatility != null && m.volatility < 5 && (m.totalYears ?? 0) >= 3) r.push(`年度回報穩定（波幅僅 ${m.volatility}%）`);

  // 成本
  if (m.fer != null && m.ferRank != null) {
    if (m.ferRank >= 75) r.push(`費用率 ${m.fer.toFixed(2)}% 屬同類較低`);
    else if (m.ferRank <= 25) r.push(`費用率 ${m.fer.toFixed(2)}% 偏高`);
  }

  // 規模
  if (m.fundSize != null) {
    if (m.fundSize >= 1000) r.push(`基金規模 ${(m.fundSize / 1000).toFixed(1)}B 港元，流動性充足`);
    else if (m.fundSize < 50) r.push(`基金規模僅 ${m.fundSize.toFixed(0)}M 港元，流動性偏低`);
  }

  if (r.length === 0) r.push('資料有限，建議參考其他指標');
  return r;
}

export function buildAction(signal: Signal): string {
  switch (signal) {
    case 'strong_buy': return '綜合評分突出，可優先考慮配置';
    case 'buy': return '表現優於同類，可考慮買入';
    case 'hold': return '表現中規中矩，建議持有觀望';
    case 'sell': return '多項指標弱於同類，建議減持';
    case 'strong_sell': return '長期表現顯著落後，建議轉換';
  }
}
