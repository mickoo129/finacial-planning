import { useState, useMemo } from 'react';
import { useMpfFunds } from '@/hooks/useMpfFunds';
import { ReturnValue } from '@/components/ReturnValue';
import { getTrusteeFromPlanId } from '@/lib/trusteeMap';
import { Zap, TrendingUp, TrendingDown, Shield, ArrowUpDown, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Signal = 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';

const SIGNAL_CONFIG: Record<Signal, { label: string; color: string; bg: string }> = {
  strong_buy: { label: '強烈買入', color: 'text-[hsl(var(--positive))]', bg: 'bg-green-100' },
  buy: { label: '買入', color: 'text-green-600', bg: 'bg-green-50' },
  hold: { label: '持有', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  sell: { label: '賣出', color: 'text-orange-600', bg: 'bg-orange-50' },
  strong_sell: { label: '強烈賣出', color: 'text-[hsl(var(--negative))]', bg: 'bg-red-50' },
};

interface FundScore {
  fund: ReturnType<typeof useMpfFunds>['data'] extends (infer T)[] | undefined ? T : never;
  score: number;
  signal: Signal;
  momentum: number;
  consistency: number;
  riskAdj: number;
}

function calculateScore(fund: any): FundScore {
  const ytd = fund.return_ytd ?? 0;
  const m3 = fund.return_3m ?? 0;
  const y1 = fund.return_1y ?? 0;
  const y3 = fund.return_3y ?? 0;

  // Momentum score (0-100): short-term vs long-term
  const annualized3m = m3 * 4;
  const momentum = Math.min(100, Math.max(0,
    50 + (annualized3m > y1 ? 15 : -10) +
    (ytd > 0 ? 10 : -5) +
    (y1 > 0 ? 15 : -10) +
    Math.min(20, y1 * 0.5)
  ));

  // Consistency score (0-100): how aligned are different periods
  const returns = [ytd, m3 * 4, y1, y3 / 3].filter(r => r !== 0);
  const allPositive = returns.every(r => r > 0);
  const allNegative = returns.every(r => r < 0);
  const consistency = allPositive ? 80 + Math.min(20, returns.length * 5) :
    allNegative ? 20 :
    50 + (returns.filter(r => r > 0).length / returns.length) * 30;

  // Risk-adjusted score (0-100)
  const riskLevel = fund.risk_level;
  const riskMultiplier = riskLevel === '低' ? 1.2 : riskLevel === '中' ? 1.0 : 0.85;
  const riskAdj = Math.min(100, Math.max(0, (y1 > 0 ? 50 + y1 * riskMultiplier : 30 + y1 * 0.5)));

  // Overall score
  const score = Math.round(momentum * 0.4 + consistency * 0.3 + riskAdj * 0.3);

  // Signal
  let signal: Signal;
  if (score >= 80) signal = 'strong_buy';
  else if (score >= 65) signal = 'buy';
  else if (score >= 45) signal = 'hold';
  else if (score >= 30) signal = 'sell';
  else signal = 'strong_sell';

  return { fund, score, signal, momentum: Math.round(momentum), consistency: Math.round(consistency), riskAdj: Math.round(riskAdj) };
}

export default function RadarSignals() {
  const { data: funds, isLoading } = useMpfFunds();
  const [category, setCategory] = useState('all');
  const [signalFilter, setSignalFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'score' | 'momentum' | 'return_1y'>('score');

  const categories = useMemo(() => {
    if (!funds) return [];
    const cats = new Set(funds.map(f => f.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [funds]);

  const scoredFunds = useMemo(() => {
    if (!funds) return [];
    let filtered = funds;
    if (category !== 'all') filtered = filtered.filter(f => f.category === category);
    
    const scored = filtered.map(calculateScore);
    
    if (signalFilter !== 'all') {
      return scored.filter(s => s.signal === signalFilter);
    }
    
    return scored.sort((a, b) => {
      if (sortField === 'score') return b.score - a.score;
      if (sortField === 'momentum') return b.momentum - a.momentum;
      return (b.fund.return_1y ?? 0) - (a.fund.return_1y ?? 0);
    });
  }, [funds, category, signalFilter, sortField]);

  const signalSummary = useMemo(() => {
    if (!funds) return {};
    const allScored = funds.map(calculateScore);
    const summary: Record<Signal, number> = { strong_buy: 0, buy: 0, hold: 0, sell: 0, strong_sell: 0 };
    allScored.forEach(s => summary[s.signal]++);
    return summary;
  }, [funds]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="text-muted-foreground text-sm">載入中...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">RADAR 量化訊號</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          基於動量、一致性、風險調整回報嘅量化評分系統
        </p>
      </div>

      {/* Signal summary */}
      <div className="grid grid-cols-5 gap-2">
        {(Object.entries(SIGNAL_CONFIG) as [Signal, typeof SIGNAL_CONFIG[Signal]][]).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setSignalFilter(signalFilter === key ? 'all' : key)}
            className={`rounded-xl border p-2 sm:p-3 text-center transition-all ${
              signalFilter === key ? 'border-primary ring-1 ring-primary' : 'border-border'
            } ${config.bg}`}
          >
            <div className={`text-lg sm:text-2xl font-bold ${config.color}`}>
              {(signalSummary as any)[key] || 0}
            </div>
            <div className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">{config.label}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-3 sm:p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[140px]">
            <label className="text-xs text-muted-foreground mb-1 block">類別</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="全部類別" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部類別</SelectItem>
                {categories.map(c => <SelectItem key={c!} value={c!}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="text-xs text-muted-foreground mb-1 block">排序</label>
            <Select value={sortField} onValueChange={(v: any) => setSortField(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">綜合評分</SelectItem>
                <SelectItem value="momentum">動量評分</SelectItem>
                <SelectItem value="return_1y">1年回報</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Scored fund list */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-border flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground text-sm">{scoredFunds.length} 隻基金</span>
        </div>
        <div className="divide-y divide-border">
          {scoredFunds.slice(0, 50).map((s) => {
            const config = SIGNAL_CONFIG[s.signal];
            return (
              <div key={s.fund.etnet_fund_id} className="px-3 sm:px-5 py-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${config.bg} ${config.color}`}>
                        {config.label}
                      </span>
                      <span className="text-xs font-bold text-foreground">{s.score}分</span>
                    </div>
                    <div className="font-medium text-foreground text-sm mt-1 truncate">{s.fund.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {getTrusteeFromPlanId(s.fund.etnet_plan_id)} · {s.fund.category} · {s.fund.risk_level || '—'}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <ReturnValue value={s.fund.return_1y} className="text-base font-bold" />
                    <div className="text-[10px] text-muted-foreground">1年</div>
                  </div>
                </div>
                {/* Score breakdown */}
                <div className="flex gap-2 mt-2">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
                      <span>動量</span><span>{s.momentum}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${s.momentum}%` }} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
                      <span>一致性</span><span>{s.consistency}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${s.consistency}%` }} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
                      <span>風險調整</span><span>{s.riskAdj}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${s.riskAdj}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        * RADAR 訊號基於歷史數據量化分析，僅供參考，不構成投資建議。評分由動量(40%)、一致性(30%)、風險調整回報(30%)組成。
      </p>
    </div>
  );
}
