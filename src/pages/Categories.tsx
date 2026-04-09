import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TimePeriodSelector } from '@/components/TimePeriodSelector';
import { ReturnValue } from '@/components/ReturnValue';
import { TimePeriod, TIME_PERIOD_LABELS } from '@/types/mpf';
import { getCategories, getFundsByCategory, getAllFunds, getSubCategories, TRUSTEES } from '@/data/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const CHART_COLORS = [
  'hsl(217, 91%, 60%)',   // blue
  'hsl(142, 71%, 45%)',   // green
  'hsl(45, 93%, 47%)',    // yellow
  'hsl(262, 83%, 58%)',   // purple
  'hsl(24, 95%, 53%)',    // orange
  'hsl(340, 82%, 52%)',   // pink
];

export default function Categories() {
  const [period, setPeriod] = useState<TimePeriod>('1y');
  const [expanded, setExpanded] = useState<string | null>(null);

  const categories = useMemo(() => getCategories(), []);
  const totalFunds = useMemo(() => getAllFunds().length, []);

  const categoryData = useMemo(() => {
    return categories.map(cat => {
      const funds = getFundsByCategory(cat);
      const avg = funds.reduce((sum, f) => sum + f.returns[period], 0) / funds.length;
      return {
        name: cat,
        shortName: cat.replace('基金', '').replace('資產', ''),
        avgReturn: Math.round(avg * 100) / 100,
        count: funds.length,
        funds: [...funds].sort((a, b) => b.returns[period] - a.returns[period]),
      };
    }).sort((a, b) => b.avgReturn - a.avgReturn);
  }, [categories, period]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">類別比較</h1>
        <p className="text-sm text-muted-foreground mt-1">顯示 {totalFunds} 隻基金 · 按積金局分類篩選</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <div className="text-xs text-muted-foreground">時間段</div>
        <TimePeriodSelector selected={period} onChange={setPeriod} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">① 基金類別</label>
          <Select value="all" disabled>
            <SelectTrigger><SelectValue placeholder="全部類別" /></SelectTrigger>
            <SelectContent><SelectItem value="all">全部類別</SelectItem></SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">② 基金種類</label>
          <Select value="all" disabled>
            <SelectTrigger><SelectValue placeholder="先選基金類別" /></SelectTrigger>
            <SelectContent><SelectItem value="all">全部</SelectItem></SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">③ 受託人</label>
          <Select value="all" disabled>
            <SelectTrigger><SelectValue placeholder="全部受託人" /></SelectTrigger>
            <SelectContent><SelectItem value="all">全部</SelectItem></SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">④ 計劃</label>
          <Select value="all" disabled>
            <SelectTrigger><SelectValue placeholder="先選受託人" /></SelectTrigger>
            <SelectContent><SelectItem value="all">全部</SelectItem></SelectContent>
          </Select>
        </div>
      </div>

      {/* Bar chart */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">各類別平均回報</h3>
          </div>
          <span className="text-xs text-muted-foreground">{TIME_PERIOD_LABELS[period]}</span>
        </div>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} layout="vertical" margin={{ left: 60, right: 30 }}>
              <XAxis type="number" tickFormatter={v => `${v}%`} fontSize={11} stroke="hsl(215, 16%, 47%)" />
              <YAxis type="category" dataKey="shortName" fontSize={12} stroke="hsl(215, 16%, 47%)" width={55} />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(2)}%`, '平均回報']}
                contentStyle={{
                  backgroundColor: 'hsl(0, 0%, 100%)',
                  border: '1px solid hsl(214, 32%, 91%)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="avgReturn" radius={[0, 4, 4, 0]}>
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expandable categories */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">展開查看基金</h3>
          <span className="text-xs text-muted-foreground">{TIME_PERIOD_LABELS[period]} 年化回報</span>
        </div>
        <div className="space-y-2">
          {categoryData.map((cat) => (
            <div key={cat.name} className="bg-card rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === cat.name ? null : cat.name)}
                className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-medium text-foreground">{cat.name}</div>
                    <div className="text-xs text-muted-foreground">{cat.count} 隻基金</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ReturnValue value={cat.avgReturn} className="text-lg" />
                  {expanded === cat.name ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </button>
              {expanded === cat.name && (
                <div className="border-t border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border">
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">基金</th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden sm:table-cell">受託人</th>
                        <th className="text-right px-4 py-2 font-medium text-muted-foreground">回報率</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {cat.funds.map(fund => (
                        <tr key={fund.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-2.5">
                            <Link to={`/fund/${fund.id}`} className="text-primary hover:underline text-sm">
                              {fund.name}
                            </Link>
                            <div className="text-xs text-muted-foreground mt-0.5 sm:hidden">{fund.trustee}</div>
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell text-xs">{fund.trustee}</td>
                          <td className="px-4 py-2.5 text-right">
                            <ReturnValue value={fund.returns[period]} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
