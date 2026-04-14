import { useState, useMemo } from 'react';
import { ReturnValue } from '@/components/ReturnValue';
import { useMpfFunds } from '@/hooks/useMpfFunds';
import { ReturnField, RETURN_LABELS, RETURN_FIELDS } from '@/lib/returnFields';
import { getFallbackReturn } from '@/lib/fallbackReturn';
import { getTrusteeFromPlanId } from '@/lib/trusteeMap';
import { groupFundsByName, type FundGroup } from '@/lib/fundGrouping';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, ChevronDown } from 'lucide-react';

const CANDY_COLORS = [
  { bg: 'hsl(var(--candy-blue))', fg: 'hsl(var(--candy-blue-fg))' },
  { bg: 'hsl(var(--candy-green))', fg: 'hsl(var(--candy-green-fg))' },
  { bg: 'hsl(var(--candy-purple))', fg: 'hsl(var(--candy-purple-fg))' },
  { bg: 'hsl(var(--candy-orange))', fg: 'hsl(var(--candy-orange-fg))' },
  { bg: 'hsl(var(--candy-pink))', fg: 'hsl(var(--candy-pink-fg))' },
  { bg: 'hsl(var(--candy-teal))', fg: 'hsl(var(--candy-teal-fg))' },
];

function getCandyColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return CANDY_COLORS[Math.abs(hash) % CANDY_COLORS.length];
}

function CategoryBadge({ category }: { category: string | null | undefined }) {
  if (!category) return null;
  const color = getCandyColor(category);
  return (
    <span
      className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ background: color.bg, color: color.fg }}
    >
      {category}
    </span>
  );
}

export default function TrusteeCompare() {
  const [period, setPeriod] = useState<ReturnField>('return_1y');
  const { data: funds, isLoading } = useMpfFunds();

  const trusteeGroups = useMemo(() => {
    if (!funds?.length) return [];
    const groups: Record<string, typeof funds> = {};
    for (const fund of funds) {
      const trustee = fund.trustee_name || getTrusteeFromPlanId(fund.etnet_plan_id);
      if (!trustee) continue;
      if (!groups[trustee]) groups[trustee] = [];
      groups[trustee].push(fund);
    }
    return Object.entries(groups)
      .map(([name, groupFunds]) => {
        const validFunds = groupFunds.filter(f => f[period] != null);
        const avg = validFunds.length
          ? validFunds.reduce((s, f) => s + (f[period] ?? 0), 0) / validFunds.length
          : 0;
        const schemeMap = new Map<string, typeof groupFunds>();
        for (const f of groupFunds) {
          const s = f.scheme_name || '未分類';
          if (!schemeMap.has(s)) schemeMap.set(s, []);
          schemeMap.get(s)!.push(f);
        }
        const schemes = [...schemeMap.entries()].map(([schemeName, schemeFunds]) => ({
          name: schemeName,
          funds: [...schemeFunds].sort((a, b) => (b[period] ?? 0) - (a[period] ?? 0)),
          count: schemeFunds.length,
        }));
        return { name, funds: [...groupFunds].sort((a, b) => (b[period] ?? 0) - (a[period] ?? 0)), avg, count: groupFunds.length, schemes };
      })
      .sort((a, b) => b.avg - a.avg);
  }, [funds, period]);

  const [trustee1, setTrustee1] = useState('');
  const [trustee2, setTrustee2] = useState('');
  const [scheme1, setScheme1] = useState('all');
  const [scheme2, setScheme2] = useState('all');

  const t1 = trustee1 || trusteeGroups[0]?.name || '';
  const t2 = trustee2 || trusteeGroups[1]?.name || '';
  const group1 = trusteeGroups.find(g => g.name === t1);
  const group2 = trusteeGroups.find(g => g.name === t2);

  const trusteeNames = trusteeGroups.map(g => g.name);

  const getFilteredFunds = (group: typeof group1, scheme: string) => {
    if (!group) return [];
    if (scheme === 'all') return group.funds;
    return group.funds.filter(f => (f.scheme_name || '未分類') === scheme);
  };

  const funds1 = getFilteredFunds(group1, scheme1);
  const funds2 = getFilteredFunds(group2, scheme2);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!funds?.length) {
    return (
      <div className="text-center py-20 text-muted-foreground text-sm">
        暫無數據，請先在排名頁面更新數據
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-foreground tracking-tight">受托人比較</h1>
        <p className="text-[11px] text-muted-foreground">比較不同受託人旗下基金整體表現，可細分計劃名稱</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <Select value={t1} onValueChange={v => { setTrustee1(v); setScheme1('all'); }}>
          <SelectTrigger className="w-full sm:w-44 h-9 text-xs rounded-2xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            {trusteeNames.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground text-xs self-center font-medium">VS</span>
        <Select value={t2} onValueChange={v => { setTrustee2(v); setScheme2('all'); }}>
          <SelectTrigger className="w-full sm:w-44 h-9 text-xs rounded-2xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            {trusteeNames.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex flex-wrap gap-1 sm:ml-auto bg-white/70 backdrop-blur-xl rounded-2xl border border-border p-1">
          {RETURN_FIELDS.map(key => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all ${
                period === key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {RETURN_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      {/* Side-by-side cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {group1 && <TrusteeCard group={group1} scheme={scheme1} setScheme={setScheme1} fundList={funds1} period={period} />}
        {group2 && <TrusteeCard group={group2} scheme={scheme2} setScheme={setScheme2} fundList={funds2} period={period} />}
      </div>

      {/* All trustees overview */}
      <div className="glass-card rounded-3xl shadow-[0_8px_30px_-12px_hsl(230_60%_70%/0.15)]">
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-sm font-semibold text-foreground">全部受託人排名（{RETURN_LABELS[period]} 平均回報）</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full banking-table min-w-[500px]">
            <thead>
              <tr className="border-y border-border/60 bg-muted/30">
                <th className="text-left px-5 py-2 text-muted-foreground w-8">#</th>
                <th className="text-left px-5 py-2 text-muted-foreground">受託人</th>
                <th className="text-center px-5 py-2 text-muted-foreground">基金數目</th>
                <th className="text-right px-5 py-2 text-muted-foreground">平均回報</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {trusteeGroups.map((group, i) => (
                <tr key={group.name}>
                  <td className="px-5 py-2.5 text-xs text-muted-foreground">{i + 1}</td>
                  <td className="px-5 py-2.5 text-sm font-medium text-foreground">{group.name}</td>
                  <td className="px-5 py-2.5 text-center text-xs text-muted-foreground">{group.count}</td>
                  <td className="px-5 py-2.5 text-right">
                    <ReturnValue value={group.avg} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TrusteeCard({ group, scheme, setScheme, fundList, period }: {
  group: { name: string; avg: number; count: number; schemes: { name: string; count: number; funds: any[] }[] };
  scheme: string;
  setScheme: (v: string) => void;
  fundList: any[];
  period: ReturnField;
}) {
  const fundGroups = useMemo(() => groupFundsByName(fundList, period), [fundList, period]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (name: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  return (
    <div className="glass-card rounded-3xl shadow-[0_8px_30px_-12px_hsl(230_60%_70%/0.15)]">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{group.name}</h3>
              <span className="text-[10px] text-muted-foreground">{fundGroups.length} 隻基金（{fundList.length} 單位）</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground mb-0.5">平均回報</div>
            <ReturnValue value={group.avg} className="text-sm" />
          </div>
        </div>

        <div className="mt-3">
          <Select value={scheme} onValueChange={setScheme}>
            <SelectTrigger className="h-8 text-[11px] rounded-2xl"><SelectValue placeholder="全部計劃" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部計劃</SelectItem>
              {group.schemes.map(s => (
                <SelectItem key={s.name} value={s.name}>{s.name} ({s.count})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {scheme === 'all' && group.schemes.length > 1 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {group.schemes.map(s => (
              <button
                key={s.name}
                onClick={() => setScheme(s.name)}
                className="text-[10px] px-2.5 py-1 rounded-full bg-muted/60 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
              >
                {s.name} <span className="font-semibold">{s.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full banking-table">
          <thead>
            <tr className="border-y border-border/60 bg-muted/30">
              <th className="text-left px-3 py-2 text-muted-foreground">基金</th>
              <th className="text-left px-3 py-2 text-muted-foreground hidden sm:table-cell">類別</th>
              <th className="text-right px-3 py-2 text-muted-foreground">回報率</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {fundGroups.map(fg => (
              <FundGroupRow
                key={fg.baseName}
                fg={fg}
                isOpen={expanded.has(fg.baseName)}
                onToggle={() => toggle(fg.baseName)}
                period={period}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FundGroupRow({ fg, isOpen, onToggle, period }: {
  fg: FundGroup;
  isOpen: boolean;
  onToggle: () => void;
  period: ReturnField;
}) {
  const best = fg.bestFund;
  const bestUnitClass = fg.variants[0].unitClass;
  const bestReturn = getFallbackReturn(best, period);

  return (
    <>
      <tr
        className={fg.hasMultiple ? 'cursor-pointer hover:bg-muted/30 transition-colors' : ''}
        onClick={fg.hasMultiple ? onToggle : undefined}
      >
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            {fg.hasMultiple && (
              <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            )}
            <div>
              <div className="text-sm text-foreground leading-tight max-w-[200px] truncate">
                {fg.baseName}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                {best.scheme_name && (
                  <span className="text-[9px] text-muted-foreground/70 truncate max-w-[120px]">{best.scheme_name}</span>
                )}
                {fg.hasMultiple && (
                  <span className="text-[9px] text-primary/70 font-medium">{fg.variants.length} 個單位</span>
                )}
                {bestUnitClass && (
                  <span className="text-[9px] text-muted-foreground">最佳: {bestUnitClass}</span>
                )}
                <span className="sm:hidden text-[10px] text-muted-foreground">{best.sub_category || best.category || '未分類'}</span>
              </div>
            </div>
          </div>
        </td>
        <td className="px-3 py-2.5 hidden sm:table-cell">
          <CategoryBadge category={best.sub_category || best.category || '未分類'} />
        </td>
        <td className="px-3 py-2.5 text-right">
          <ReturnValue value={bestReturn?.value} fallbackLabel={bestReturn?.isFallback ? bestReturn.label : undefined} />
        </td>
      </tr>
      {isOpen && fg.variants.map(v => {
        const variantReturn = getFallbackReturn(v.fund, period);
        return (
          <tr key={v.fund.etnet_fund_id} className="bg-muted/20">
            <td className="px-3 py-1.5 pl-9">
              <span className="text-[11px] text-muted-foreground">
                {v.unitClass ? `單位 ${v.unitClass}` : (v.fund.name_zh || v.fund.name)}
              </span>
            </td>
            <td className="px-3 py-1.5 hidden sm:table-cell" />
            <td className="px-3 py-1.5 text-right">
              <ReturnValue value={variantReturn?.value} fallbackLabel={variantReturn?.isFallback ? variantReturn.label : undefined} className="text-xs" />
            </td>
          </tr>
        );
      })}
    </>
  );
}
