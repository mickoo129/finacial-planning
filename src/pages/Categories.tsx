import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ReturnValue } from '@/components/ReturnValue';
import { useMpfFunds, MpfFund } from '@/hooks/useMpfFunds';
import { CascadingFundFilter, getMainCategory } from '@/components/CascadingFundFilter';
import { ReturnField, RETURN_LABELS, RETURN_FIELDS } from '@/lib/returnFields';
import { ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

export default function Categories() {
  const [sortBy, setSortBy] = useState<ReturnField>('return_1y');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);
  const { data: funds, isLoading } = useMpfFunds();
  const [cascadeFiltered, setCascadeFiltered] = useState<MpfFund[]>([]);

  const handleFilterChange = useCallback((filtered: MpfFund[]) => {
    setCascadeFiltered(filtered);
  }, []);

  const displayFunds = cascadeFiltered.length > 0 ? cascadeFiltered : (funds || []);

  // Group by main category, then sub-category
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
        const subGroups = new Map<string, MpfFund[]>();
        for (const fund of mainFunds) {
          const sub = fund.sub_category || fund.category || mainName;
          if (!subGroups.has(sub)) subGroups.set(sub, []);
          subGroups.get(sub)!.push(fund);
        }

        const subCategories = [...subGroups.entries()]
          .map(([subName, subFunds]) => {
            const withReturn = subFunds.filter(f => f[sortBy] != null);
            const avg = withReturn.length > 0
              ? withReturn.reduce((sum, f) => sum + (f[sortBy] ?? 0), 0) / withReturn.length
              : 0;
            return {
              name: subName,
              avgReturn: Math.round(avg * 100) / 100,
              count: subFunds.length,
              funds: [...subFunds].sort((a, b) => (b[sortBy] ?? 0) - (a[sortBy] ?? 0)),
            };
          })
          .sort((a, b) => b.avgReturn - a.avgReturn);

        const withReturn = mainFunds.filter(f => f[sortBy] != null);
        const avg = withReturn.length > 0
          ? withReturn.reduce((sum, f) => sum + (f[sortBy] ?? 0), 0) / withReturn.length
          : 0;

        return {
          name: mainName,
          shortName: mainName.replace('基金', ''),
          avgReturn: Math.round(avg * 100) / 100,
          count: mainFunds.length,
          subCategories,
        };
      })
      .sort((a, b) => b.avgReturn - a.avgReturn);
  }, [displayFunds, sortBy]);

  // Flatten sub-categories for chart
  const chartData = useMemo(() => {
    const all: Array<{ name: string; shortName: string; avgReturn: number }> = [];
    for (const main of categoryData) {
      for (const sub of main.subCategories) {
        all.push({
          name: sub.name,
          shortName: sub.name.replace('基金', '').replace('預設投資-', ''),
          avgReturn: sub.avgReturn,
        });
      }
    }
    return all.sort((a, b) => b.avgReturn - a.avgReturn).slice(0, 20);
  }, [categoryData]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">載入中...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-foreground">類別比較</h1>
        <p className="text-xs text-muted-foreground mt-1">
          顯示 {displayFunds.length} / {funds?.length || 0} 隻基金 · 按基金類別和種類篩選
        </p>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border border-border p-4 space-y-3">
        {funds && <CascadingFundFilter funds={funds} onFilteredFundsChange={handleFilterChange} />}
        <div className="flex flex-wrap gap-1 bg-muted/50 rounded-lg p-1">
          {RETURN_FIELDS.map(key => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                sortBy === key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {RETURN_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      {/* Bar chart - sub categories */}
      {chartData.length > 0 && (
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground text-sm">各基金種類平均回報</h3>
            </div>
            <span className="text-[10px] text-muted-foreground">{RETURN_LABELS[sortBy]}</span>
          </div>
          <div style={{ height: Math.max(200, chartData.length * 28) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 100, right: 30 }}>
                <XAxis type="number" tickFormatter={v => `${v}%`} fontSize={10} stroke="hsl(215, 16%, 47%)" />
                <YAxis type="category" dataKey="shortName" fontSize={10} stroke="hsl(215, 16%, 47%)" width={95} />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(2)}%`, '平均回報']}
                  contentStyle={{
                    backgroundColor: 'hsl(0, 0%, 100%)',
                    border: '1px solid hsl(214, 32%, 91%)',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="avgReturn" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.avgReturn >= 0 ? 'hsl(142, 71%, 45%)' : 'hsl(0, 84%, 60%)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Expandable categories with sub-category drill-down */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground text-sm">基金類別 → 基金種類</h3>
          <span className="text-[10px] text-muted-foreground">{RETURN_LABELS[sortBy]}</span>
        </div>
        <div className="space-y-2">
          {categoryData.map((cat) => (
            <div key={cat.name} className="bg-card rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === cat.name ? null : cat.name)}
                className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
              >
                <div>
                  <div className="font-medium text-foreground text-sm">{cat.name}</div>
                  <div className="text-[10px] text-muted-foreground">{cat.count} 隻基金 · {cat.subCategories.length} 個種類</div>
                </div>
                <div className="flex items-center gap-3">
                  <ReturnValue value={cat.avgReturn} className="text-base" />
                  {expanded === cat.name ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </button>
              {expanded === cat.name && (
                <div className="border-t border-border">
                  {cat.subCategories.map(sub => (
                    <div key={sub.name}>
                      <button
                        onClick={() => setExpandedSub(expandedSub === sub.name ? null : sub.name)}
                        className="w-full text-left px-6 py-2.5 flex items-center justify-between hover:bg-muted/20 transition-colors border-b border-border/50"
                      >
                        <div>
                          <span className="text-sm text-foreground">{sub.name}</span>
                          <span className="text-[10px] text-muted-foreground ml-2">{sub.count} 隻</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ReturnValue value={sub.avgReturn} />
                          {expandedSub === sub.name ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
                        </div>
                      </button>
                      {expandedSub === sub.name && (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-muted/30 border-b border-border">
                              <th className="text-left px-6 py-1.5 font-medium text-muted-foreground text-[10px]">基金</th>
                              <th className="text-right px-4 py-1.5 font-medium text-muted-foreground text-[10px]">FER</th>
                              <th className="text-right px-4 py-1.5 font-medium text-muted-foreground text-[10px]">回報率</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {sub.funds.map(fund => (
                              <tr key={fund.id} className="hover:bg-muted/20 transition-colors">
                                <td className="px-6 py-2">
                                  <Link to={`/fund/${fund.id}`} className="text-primary hover:underline text-xs">
                                    {fund.name_zh || fund.name}
                                  </Link>
                                  <div className="text-[10px] text-muted-foreground mt-0.5">
                                    {fund.trustee_name} · {fund.scheme_name}
                                  </div>
                                </td>
                                <td className="px-4 py-2 text-right text-[10px] text-muted-foreground">
                                  {fund.fee_ratio != null ? `${fund.fee_ratio.toFixed(2)}%` : '-'}
                                </td>
                                <td className="px-4 py-2 text-right">
                                  <ReturnValue value={fund[sortBy]} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
