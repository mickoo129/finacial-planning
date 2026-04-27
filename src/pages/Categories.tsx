import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ReturnValue } from '@/components/ReturnValue';
import { useMpfFunds, MpfFund } from '@/hooks/useMpfFunds';
import { CascadingFundFilter, getMainCategory } from '@/components/CascadingFundFilter';
import { ReturnField, RETURN_LABELS, RETURN_FIELDS } from '@/lib/returnFields';
import { getFallbackReturn } from '@/lib/fallbackReturn';
import { deduplicateFunds } from '@/lib/fundGrouping';
import { resolveTrustee } from '@/lib/trusteeMap';
import { filterFundsBySource } from '@/lib/fundSource';
import { ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { DataSourceBadge } from '@/components/DataSourceBadge';

export default function Categories() {
  const [sortBy, setSortBy] = useState<ReturnField>('return_1y');
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data: funds, isLoading } = useMpfFunds();
  const [cascadeFiltered, setCascadeFiltered] = useState<MpfFund[]>([]);

  const handleFilterChange = useCallback((filtered: MpfFund[]) => {
    setCascadeFiltered(filtered);
  }, []);

  const displayFunds = useMemo(() => {
    const base = cascadeFiltered.length > 0 ? cascadeFiltered : (funds || []);
    // 雙源策略：按時段揀來源（短線 ETNET、長線 MPFA）
    const sourced = filterFundsBySource(base, sortBy);
    return deduplicateFunds(sourced, sortBy);
  }, [cascadeFiltered, funds, sortBy]);

  const categoryData = useMemo(() => {
    if (!displayFunds.length) return [];
    const mainGroups = new Map<string, MpfFund[]>();
    for (const fund of displayFunds) {
      const main = getMainCategory(fund);
      if (!mainGroups.has(main)) mainGroups.set(main, []);
      mainGroups.get(main)!.push(fund);
    }
    return [...mainGroups.entries()]
      .map(([mainName, mainFunds]) => {
        const withReturn = mainFunds.filter(f => f[sortBy] != null);
        const avg = withReturn.length > 0 ? withReturn.reduce((sum, f) => sum + (f[sortBy] ?? 0), 0) / withReturn.length : 0;
        return {
          name: mainName,
          shortName: mainName.replace('基金', ''),
          avgReturn: Math.round(avg * 100) / 100,
          count: mainFunds.length,
          funds: [...mainFunds].sort((a, b) => (b[sortBy] ?? 0) - (a[sortBy] ?? 0)),
        };
      })
      .sort((a, b) => b.avgReturn - a.avgReturn);
  }, [displayFunds, sortBy]);

  const chartData = useMemo(() => categoryData.map(cat => ({ name: cat.name, shortName: cat.shortName, avgReturn: cat.avgReturn })), [categoryData]);

  if (isLoading) return <div className="flex items-center justify-center h-64 text-muted-foreground">載入中...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-foreground">類別比較</h1>
        <p className="text-xs text-muted-foreground mt-1">顯示 {displayFunds.length} / {funds?.length || 0} 隻基金 · 按基金類別和種類篩選</p>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-3xl p-4 space-y-3">
        {funds && <CascadingFundFilter funds={funds} onFilteredFundsChange={handleFilterChange} selectedField={sortBy} />}
        <div className="flex flex-wrap gap-1 bg-muted/30 rounded-2xl p-1">
          {RETURN_FIELDS.map(key => (
            <button key={key} onClick={() => setSortBy(key)} className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-colors ${sortBy === key ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {RETURN_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      {/* Bar chart */}
      {chartData.length > 0 && (
        <div className="glass-card rounded-3xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground text-sm">各基金類別平均回報</h3>
            </div>
            <span className="text-[10px] text-muted-foreground">{RETURN_LABELS[sortBy]}</span>
          </div>
          <div className="space-y-2">
            {(() => {
              const maxPos = Math.max(...chartData.map(c => c.avgReturn > 0 ? c.avgReturn : 0), 0);
              const maxNeg = Math.max(...chartData.map(c => c.avgReturn < 0 ? -c.avgReturn : 0), 0);
              const hasNegative = maxNeg > 0;
              const total = maxPos + maxNeg || 0.01;
              // Axis position (% from left): negative side占 maxNeg/total，正側占 maxPos/total
              const axisPct = hasNegative ? (maxNeg / total) * 100 : 0;
              // Distinct HSL hues per category for visual differentiation
              const palette = [
                'hsl(210 90% 55%)', // blue
                'hsl(160 70% 42%)', // teal/green
                'hsl(280 65% 58%)', // purple
                'hsl(35 92% 55%)',  // orange
                'hsl(340 75% 55%)', // pink/red
                'hsl(190 80% 45%)', // cyan
                'hsl(50 90% 50%)',  // yellow
                'hsl(10 80% 55%)',  // coral
                'hsl(130 55% 45%)', // green
                'hsl(250 70% 60%)', // indigo
              ];
              return chartData.map((cat, idx) => {
                const isPositive = cat.avgReturn >= 0;
                const color = palette[idx % palette.length];
                let barStyle: React.CSSProperties;
                if (hasNegative) {
                  // Dynamic axis layout: 正數佔右側 (100 - axisPct)%, 負數佔左側 axisPct%
                  if (isPositive) {
                    const widthPct = maxPos > 0 ? (cat.avgReturn / maxPos) * (100 - axisPct) : 0;
                    barStyle = {
                      width: `${widthPct}%`,
                      backgroundColor: color,
                      left: `${axisPct}%`,
                    };
                  } else {
                    const widthPct = maxNeg > 0 ? (Math.abs(cat.avgReturn) / maxNeg) * axisPct : 0;
                    barStyle = {
                      width: `${widthPct}%`,
                      backgroundColor: color,
                      left: `${axisPct - widthPct}%`,
                    };
                  }
                } else {
                  // Left-aligned full-width layout
                  const widthPct = maxPos > 0 ? Math.min((cat.avgReturn / maxPos) * 100, 100) : 0;
                  barStyle = {
                    width: `${widthPct}%`,
                    backgroundColor: color,
                    left: 0,
                  };
                }
                return (
                  <div key={cat.name} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-24 text-right shrink-0">{cat.shortName}</span>
                    <div className="flex-1 h-6 bg-muted/30 rounded-full overflow-hidden relative">
                      {hasNegative && (
                        <div className="absolute top-0 bottom-0 w-px bg-border/60" style={{ left: `${axisPct}%` }} />
                      )}
                      <div className="absolute top-0 bottom-0" style={barStyle} />
                    </div>
                    <ReturnValue value={cat.avgReturn} className="w-16 text-right" />
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Expandable categories */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground text-sm">基金類別</h3>
          <span className="text-[10px] text-muted-foreground">{RETURN_LABELS[sortBy]}</span>
        </div>
        <div className="space-y-2">
          {categoryData.map((cat) => (
            <div key={cat.name} className="glass-card rounded-3xl overflow-hidden">
              <button onClick={() => setExpanded(expanded === cat.name ? null : cat.name)} className="w-full text-left px-5 py-3.5 flex items-center justify-between hover:bg-[hsl(var(--row-hover))] transition-colors">
                <div>
                  <div className="font-medium text-foreground text-sm">{cat.name}</div>
                  <div className="text-[10px] text-muted-foreground">{cat.count} 隻基金</div>
                </div>
                <div className="flex items-center gap-3">
                  <ReturnValue value={cat.avgReturn} className="text-sm" />
                  {expanded === cat.name ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </button>
              {expanded === cat.name && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-t border-border/60 banking-table min-w-[400px]">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border/60">
                        <th className="text-left px-5 py-1.5 font-medium text-muted-foreground text-[10px]">基金</th>
                        <th className="text-right px-5 py-1.5 font-medium text-muted-foreground text-[10px]">回報率</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {cat.funds.map(fund => {
                        const fb = getFallbackReturn(fund, sortBy);
                        return (
                        <tr key={fund.id}>
                          <td className="px-5 py-2.5">
                            <Link to={`/fund/${fund.id}`} className="text-primary hover:underline text-xs">
                              <span className="max-w-[220px] truncate inline-block align-bottom">{fund.name_zh || fund.name}</span>
                            </Link>
                            <div className="text-[10px] text-muted-foreground mt-0.5">{resolveTrustee(fund, sortBy)} · {fund.scheme_name}</div>
                          </td>
                          
                          <td className="px-5 py-2.5 text-right">
                            <ReturnValue 
                              value={fb?.value ?? null} 
                              fallbackLabel={fb?.isFallback ? fb.label : undefined} 
                            />
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Data source footer */}
      <div className="pt-4 mt-2 border-t border-border/40 flex justify-center">
        <DataSourceBadge field={sortBy} />
      </div>
    </div>
  );
}
