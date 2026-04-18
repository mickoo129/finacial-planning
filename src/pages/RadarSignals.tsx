import { useState, useMemo } from 'react';
import { useMpfFunds } from '@/hooks/useMpfFunds';
import { ReturnValue } from '@/components/ReturnValue';
import { resolveTrustee } from '@/lib/trusteeMap';
import { getMainCategory } from '@/components/CascadingFundFilter';
import { Zap } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { buildScoredFunds, buildReasons, buildAction, type Signal, type ScoredFund } from '@/lib/radarScoring';

const SIGNAL_CONFIG: Record<Signal, { label: string; color: string; bg: string }> = {
  strong_buy: { label: '強烈買入', color: 'text-positive', bg: 'bg-[hsl(var(--positive-bg))]' },
  buy: { label: '買入', color: 'text-[hsl(155_60%_35%)]', bg: 'bg-[hsl(var(--candy-green))]' },
  hold: { label: '持有', color: 'text-[hsl(40_70%_45%)]', bg: 'bg-[hsl(var(--candy-orange))]' },
  sell: { label: '賣出', color: 'text-[hsl(25_65%_45%)]', bg: 'bg-[hsl(var(--candy-orange))]' },
  strong_sell: { label: '強烈賣出', color: 'text-negative', bg: 'bg-[hsl(var(--negative-bg))]' },
};

export default function RadarSignals() {
  const { data: funds, isLoading } = useMpfFunds();
  const [category, setCategory] = useState('all');
  const [trustee, setTrustee] = useState('all');
  const [scheme, setScheme] = useState('all');
  const [signalFilter, setSignalFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'score' | 'longTerm' | 'return_3y' | 'return_5y' | 'return_10y'>('score');

  // 全部基金都先評分（用全市場做百分位基準）
  const allScored = useMemo<ScoredFund[]>(() => funds ? buildScoredFunds(funds) : [], [funds]);

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

  const filteredScored = useMemo(() => {
    let pool = allScored;
    if (category !== 'all') pool = pool.filter(s => getMainCategory(s.fund) === category);
    if (trustee !== 'all') pool = pool.filter(s => resolveTrustee(s.fund) === trustee);
    if (scheme !== 'all') pool = pool.filter(s => s.fund.scheme_name === scheme);
    return pool;
  }, [allScored, category, trustee, scheme]);

  const scoredFunds = useMemo(() => {
    let scored = filteredScored;
    if (signalFilter !== 'all') scored = scored.filter(s => s.signal === signalFilter);
    const r5 = (f: any) => f.return_5y ?? -999;
    const r3 = (f: any) => f.return_3y ?? -999;
    const r10 = (f: any) => f.return_10y ?? -999;
    return [...scored].sort((a, b) => {
      if (sortField === 'score') {
        // 主排：綜合分；同分先比 5y、再比 3y、再比基金規模
        return (b.score - a.score)
          || (r5(b.fund) - r5(a.fund))
          || (r3(b.fund) - r3(a.fund))
          || ((b.fund.fund_size ?? 0) - (a.fund.fund_size ?? 0));
      }
      if (sortField === 'longTerm') {
        return (b.longTerm - a.longTerm) || (r5(b.fund) - r5(a.fund)) || (r10(b.fund) - r10(a.fund));
      }
      if (sortField === 'return_10y') return (r10(b.fund) - r10(a.fund)) || (r5(b.fund) - r5(a.fund));
      if (sortField === 'return_5y') return (r5(b.fund) - r5(a.fund)) || (r3(b.fund) - r3(a.fund));
      return (r3(b.fund) - r3(a.fund)) || (r5(b.fund) - r5(a.fund));
    });
  }, [filteredScored, signalFilter, sortField]);

  const signalSummary = useMemo(() => {
    const summary: Record<Signal, number> = { strong_buy: 0, buy: 0, hold: 0, sell: 0, strong_sell: 0 };
    filteredScored.forEach(s => summary[s.signal]++);
    return summary;
  }, [filteredScored]);

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><div className="text-muted-foreground text-sm">載入中...</div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">RADAR 量化訊號</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">基於同類別百分位排名、長期回報、熊市抗跌、一致性、成本、規模嘅多維度評分</p>
      </div>

      {/* Signal summary */}
      <div className="grid grid-cols-5 gap-2">
        {(Object.entries(SIGNAL_CONFIG) as [Signal, typeof SIGNAL_CONFIG[Signal]][]).map(([key, config]) => (
          <button key={key} onClick={() => setSignalFilter(signalFilter === key ? 'all' : key)}
            className={`glass-card rounded-3xl p-2 sm:p-3 text-center transition-all ${signalFilter === key ? 'ring-2 ring-primary' : ''}`}>
            <div className={`text-lg sm:text-2xl font-bold ${config.color}`}>{signalSummary[key] || 0}</div>
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
                <SelectItem value="longTerm">長期回報排名</SelectItem>
                <SelectItem value="return_3y">3年回報</SelectItem>
                <SelectItem value="return_5y">5年回報</SelectItem>
                <SelectItem value="return_10y">10年回報</SelectItem>
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
            const reasons = buildReasons(s);
            const action = buildAction(s.signal);
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
                    <ReturnValue value={s.fund.return_5y} className="text-sm font-bold" />
                    <div className="text-[10px] text-muted-foreground">5年</div>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {[
                    { label: '長期', value: s.longTerm, color: 'bg-[hsl(var(--candy-blue-fg))]' },
                    { label: '抗跌', value: s.bearMarket, color: 'bg-[hsl(var(--candy-green-fg))]' },
                    { label: '穩定', value: s.consistency, color: 'bg-[hsl(var(--candy-purple-fg))]' },
                    { label: '成本', value: s.costEff, color: 'bg-[hsl(var(--candy-orange-fg,var(--candy-blue-fg)))]' },
                    { label: '規模', value: s.sizeStab, color: 'bg-[hsl(var(--candy-blue-fg))]' },
                  ].map(bar => (
                    <div key={bar.label}>
                      <div className="flex items-center justify-between text-[9px] text-muted-foreground mb-0.5">
                        <span>{bar.label}</span><span>{bar.value}</span>
                      </div>
                      <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${bar.color}`} style={{ width: `${bar.value}%`, opacity: 0.7 }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-[10px] text-muted-foreground bg-muted/30 rounded-lg px-2 py-1.5 leading-relaxed">
                  <span className="font-medium text-foreground">選擇原因：</span>
                  {reasons.join('；')}。{action}。
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
        * 評分組成：長期回報同類百分位 (35%) + 2022 熊市抗跌力 (20%) + 年度回報一致性 (20%) + 費用率同類比較 (15%) + 基金規模 (10%)。<br/>
        同類比較以 MPFA 子類別為基準。僅供參考，不構成投資建議。
      </p>
    </div>
  );
}
