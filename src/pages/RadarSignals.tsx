import { useState, useMemo } from 'react';
import { useMpfFunds } from '@/hooks/useMpfFunds';
import { ReturnValue } from '@/components/ReturnValue';
import { resolveTrustee } from '@/lib/trusteeMap';
import { getMainCategory } from '@/components/CascadingFundFilter';
import { Zap } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Signal = 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';

const SIGNAL_CONFIG: Record<Signal, { label: string; color: string; bg: string }> = {
  strong_buy: { label: '強烈買入', color: 'text-positive', bg: 'bg-[hsl(var(--positive-bg))]' },
  buy: { label: '買入', color: 'text-[hsl(155_60%_35%)]', bg: 'bg-[hsl(var(--candy-green))]' },
  hold: { label: '持有', color: 'text-[hsl(40_70%_45%)]', bg: 'bg-[hsl(var(--candy-orange))]' },
  sell: { label: '賣出', color: 'text-[hsl(25_65%_45%)]', bg: 'bg-[hsl(var(--candy-orange))]' },
  strong_sell: { label: '強烈賣出', color: 'text-negative', bg: 'bg-[hsl(var(--negative-bg))]' },
};

interface FundScore {
  fund: ReturnType<typeof useMpfFunds>['data'] extends (infer T)[] | undefined ? T : never;
  score: number; signal: Signal; momentum: number; consistency: number; riskAdj: number;
}

function calculateScore(fund: any): FundScore {
  const ytd = fund.return_ytd ?? 0;
  const m3 = fund.return_3m ?? 0;
  const y1 = fund.return_1y ?? 0;
  const y3 = fund.return_3y ?? 0;
  const annualized3m = m3 * 4;
  const momentum = Math.min(100, Math.max(0, 50 + (annualized3m > y1 ? 15 : -10) + (ytd > 0 ? 10 : -5) + (y1 > 0 ? 15 : -10) + Math.min(20, y1 * 0.5)));
  const returns = [ytd, m3 * 4, y1, y3 / 3].filter(r => r !== 0);
  const allPositive = returns.every(r => r > 0);
  const allNegative = returns.every(r => r < 0);
  const consistency = allPositive ? 80 + Math.min(20, returns.length * 5) : allNegative ? 20 : 50 + (returns.filter(r => r > 0).length / returns.length) * 30;
  const riskLevel = fund.risk_level;
  const riskMultiplier = riskLevel === '低' ? 1.2 : riskLevel === '中' ? 1.0 : 0.85;
  const riskAdj = Math.min(100, Math.max(0, (y1 > 0 ? 50 + y1 * riskMultiplier : 30 + y1 * 0.5)));
  const score = Math.round(momentum * 0.4 + consistency * 0.3 + riskAdj * 0.3);
  let signal: Signal;
  if (score >= 80) signal = 'strong_buy'; else if (score >= 65) signal = 'buy'; else if (score >= 45) signal = 'hold'; else if (score >= 30) signal = 'sell'; else signal = 'strong_sell';
  return { fund, score, signal, momentum: Math.round(momentum), consistency: Math.round(consistency), riskAdj: Math.round(riskAdj) };
}

export default function RadarSignals() {
  const { data: funds, isLoading } = useMpfFunds();
  const [category, setCategory] = useState('all');
  const [trustee, setTrustee] = useState('all');
  const [scheme, setScheme] = useState('all');
  const [signalFilter, setSignalFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'score' | 'momentum' | 'return_1y' | 'return_3y' | 'return_5y'>('score');

  const categories = useMemo(() => {
    if (!funds) return [];
    return Array.from(new Set(funds.map(f => getMainCategory(f)).filter(Boolean))).sort();
  }, [funds]);

  const trustees = useMemo(() => {
    if (!funds) return [];
    let pool = funds;
    if (category !== 'all') pool = pool.filter(f => getMainCategory(f) === category);
    return Array.from(new Set(pool.map(f => resolveTrustee(f)).filter(Boolean))).sort() as string[];
  }, [funds, category]);

  const schemes = useMemo(() => {
    if (!funds) return [];
    let pool = funds;
    if (category !== 'all') pool = pool.filter(f => getMainCategory(f) === category);
    if (trustee !== 'all') pool = pool.filter(f => resolveTrustee(f) === trustee);
    return Array.from(new Set(pool.map(f => f.scheme_name).filter(Boolean))).sort() as string[];
  }, [funds, category, trustee]);

  const scoredFunds = useMemo(() => {
    if (!funds) return [];
    let filtered = funds;
    if (category !== 'all') filtered = filtered.filter(f => getMainCategory(f) === category);
    if (trustee !== 'all') filtered = filtered.filter(f => resolveTrustee(f) === trustee);
    if (scheme !== 'all') filtered = filtered.filter(f => f.scheme_name === scheme);
    let scored = filtered.map(calculateScore);
    if (signalFilter !== 'all') scored = scored.filter(s => s.signal === signalFilter);
    return scored.sort((a, b) => {
      if (sortField === 'score') return b.score - a.score;
      if (sortField === 'momentum') return b.momentum - a.momentum;
      if (sortField === 'return_3y') return (b.fund.return_3y ?? 0) - (a.fund.return_3y ?? 0);
      if (sortField === 'return_5y') return (b.fund.return_5y ?? 0) - (a.fund.return_5y ?? 0);
      return (b.fund.return_1y ?? 0) - (a.fund.return_1y ?? 0);
    });
  }, [funds, category, trustee, scheme, signalFilter, sortField]);

  const signalSummary = useMemo(() => {
    if (!funds) return {} as Record<Signal, number>;
    let pool = funds;
    if (category !== 'all') pool = pool.filter(f => getMainCategory(f) === category);
    if (trustee !== 'all') pool = pool.filter(f => resolveTrustee(f) === trustee);
    if (scheme !== 'all') pool = pool.filter(f => f.scheme_name === scheme);
    const summary: Record<Signal, number> = { strong_buy: 0, buy: 0, hold: 0, sell: 0, strong_sell: 0 };
    pool.map(calculateScore).forEach(s => summary[s.signal]++);
    return summary;
  }, [funds, category, trustee, scheme]);

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><div className="text-muted-foreground text-sm">載入中...</div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">RADAR 量化訊號</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">基於動量、一致性、風險調整回報嘅量化評分系統</p>
      </div>

      {/* Signal summary */}
      <div className="grid grid-cols-5 gap-2">
        {(Object.entries(SIGNAL_CONFIG) as [Signal, typeof SIGNAL_CONFIG[Signal]][]).map(([key, config]) => (
          <button key={key} onClick={() => setSignalFilter(signalFilter === key ? 'all' : key)}
            className={`glass-card rounded-3xl p-2 sm:p-3 text-center transition-all ${signalFilter === key ? 'ring-2 ring-primary' : ''}`}>
            <div className={`text-lg sm:text-2xl font-bold ${config.color}`}>{(signalSummary as any)[key] || 0}</div>
            <div className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">{config.label}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card rounded-3xl p-3 sm:p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[140px]">
            <label className="text-xs text-muted-foreground mb-1 block">類別</label>
            <Select value={category} onValueChange={(v) => { setCategory(v); setTrustee('all'); setScheme('all'); }}>
              <SelectTrigger className="rounded-2xl"><SelectValue placeholder="全部類別" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部類別</SelectItem>
                {categories.map(c => <SelectItem key={c!} value={c!}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="text-xs text-muted-foreground mb-1 block">受託人</label>
            <Select value={trustee} onValueChange={(v) => { setTrustee(v); setScheme('all'); }}>
              <SelectTrigger className="rounded-2xl"><SelectValue placeholder="全部受託人" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部受託人</SelectItem>
                {trustees.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="text-xs text-muted-foreground mb-1 block">計劃名稱</label>
            <Select value={scheme} onValueChange={setScheme}>
              <SelectTrigger className="rounded-2xl"><SelectValue placeholder="全部計劃" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部計劃</SelectItem>
                {schemes.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="text-xs text-muted-foreground mb-1 block">排序</label>
            <Select value={sortField} onValueChange={(v: any) => setSortField(v)}>
              <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="score">綜合評分</SelectItem>
                <SelectItem value="momentum">動量評分</SelectItem>
                <SelectItem value="return_1y">1年回報</SelectItem>
                <SelectItem value="return_3y">3年回報</SelectItem>
                <SelectItem value="return_5y">5年回報</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Scored fund list */}
      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border/60 flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground text-sm">{scoredFunds.length} 隻基金</span>
        </div>
        <div className="divide-y divide-border/40">
          {scoredFunds.slice(0, 50).map((s) => {
            const config = SIGNAL_CONFIG[s.signal];
            return (
              <div key={s.fund.etnet_fund_id} className="px-5 py-3 hover:bg-[hsl(var(--row-hover))] transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${config.bg} ${config.color}`}>{config.label}</span>
                      <span className="text-xs font-bold text-foreground">{s.score}分</span>
                    </div>
                    <div className="font-medium text-foreground text-sm mt-1 truncate">{s.fund.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{resolveTrustee(s.fund)} · {getMainCategory(s.fund)} · {s.fund.risk_level || '—'}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <ReturnValue value={s.fund.return_1y} className="text-sm font-bold" />
                    <div className="text-[10px] text-muted-foreground">1年</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  {[{ label: '動量', value: s.momentum, color: 'bg-[hsl(var(--candy-blue-fg))]' },
                    { label: '一致性', value: s.consistency, color: 'bg-[hsl(var(--candy-green-fg))]' },
                    { label: '風險調整', value: s.riskAdj, color: 'bg-[hsl(var(--candy-purple-fg))]' }].map(bar => (
                    <div key={bar.label} className="flex-1">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
                        <span>{bar.label}</span><span>{bar.value}</span>
                      </div>
                      <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${bar.color}`} style={{ width: `${bar.value}%`, opacity: 0.7 }} />
                      </div>
                    </div>
                  ))}
                </div>
                {(() => {
                  const reasons: string[] = [];
                  if (s.momentum >= 70) reasons.push('動量強勁');
                  else if (s.momentum <= 35) reasons.push('動量轉弱');
                  if (s.consistency >= 75) reasons.push('回報穩定一致');
                  else if (s.consistency <= 35) reasons.push('回報波動大');
                  if (s.riskAdj >= 70) reasons.push('風險調整佳');
                  else if (s.riskAdj <= 35) reasons.push('風險回報失衡');
                  if ((s.fund.return_1y ?? 0) > 10) reasons.push('1年回報突出');
                  else if ((s.fund.return_1y ?? 0) < -5) reasons.push('1年錄得虧損');
                  if (reasons.length === 0) reasons.push('表現中規中矩');
                  const action = s.signal === 'strong_buy' || s.signal === 'buy' ? '可考慮買入' : s.signal === 'hold' ? '建議持有觀望' : '建議減持';
                  return (
                    <div className="mt-2 text-[10px] text-muted-foreground bg-muted/30 rounded-lg px-2 py-1.5">
                      <span className="font-medium text-foreground">選擇原因：</span>{reasons.join('、')}，故{action}。
                    </div>
                  );
                })()}
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
