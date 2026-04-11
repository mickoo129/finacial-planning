import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ReturnValue } from '@/components/ReturnValue';
import { useMpfFunds, MpfFund } from '@/hooks/useMpfFunds';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

type SortPeriod = 'return_ytd' | 'return_3m' | 'return_1y' | 'return_3y' | 'return_5y' | 'return_10y';

const SORT_LABELS: Record<SortPeriod, string> = {
  return_ytd: '年初至今',
  return_3m: '3個月',
  return_1y: '1年',
  return_3y: '3年',
  return_5y: '5年',
  return_10y: '10年',
};

const CHART_COLORS = [
  'hsl(217, 91%, 60%)', 'hsl(142, 71%, 45%)', 'hsl(45, 93%, 47%)',
  'hsl(262, 83%, 58%)', 'hsl(24, 95%, 53%)', 'hsl(340, 82%, 52%)',
  'hsl(195, 85%, 45%)', 'hsl(160, 60%, 45%)',
];

// Get the main category from sub_category or category
function getMainCategory(fund: MpfFund): string {
  const sub = fund.sub_category || '';
  const cat = fund.category || '';
  if (sub.startsWith('股票基金')) return '股票基金';
  if (sub.startsWith('混合資產基金')) return '混合資產基金';
  if (sub.startsWith('債券基金')) return '債券基金';
  if (sub.startsWith('保證基金')) return '保證基金';
  if (sub.startsWith('強積金保守')) return '強積金保守基金';
  if (sub.startsWith('貨幣市場')) return '貨幣市場基金';
  if (sub.startsWith('預設投資')) return '預設投資策略';
  // Fallback from etnet category
  if (cat.includes('股票')) return '股票基金';
  if (cat.includes('混合') || cat.includes('均衡') || cat.includes('保守') || cat.includes('進取')) return '混合資產基金';
  if (cat.includes('固定收益') || cat.includes('債券')) return '債券基金';
  if (cat.includes('保證')) return '保證基金';
  if (cat.includes('強積金保守')) return '強積金保守基金';
  if (cat.includes('貨幣')) return '貨幣市場基金';
  return '其他';
}

export default function Categories() {
  const [sortBy, setSortBy] = useState<SortPeriod>('return_1y');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTrustee, setSelectedTrustee] = useState('all');
  const { data: funds, isLoading } = useMpfFunds();

  const trustees = useMemo(() => {
    if (!funds) return [];
    return [...new Set(funds.map(f => f.trustee_name).filter(Boolean))].sort() as string[];
  }, [funds]);

  const categoryData = useMemo(() => {
    if (!funds) return [];
    
    let filtered = funds;
    if (selectedTrustee !== 'all') {
      filtered = filtered.filter(f => f.trustee_name === selectedTrustee);
    }

    // Group by sub_category (MPFA standard)
    const groups = new Map<string, MpfFund[]>();
    for (const fund of filtered) {
      const key = fund.sub_category || getMainCategory(fund);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(fund);
    }

    return [...groups.entries()]
      .map(([name, catFunds]) => {
        const withReturn = catFunds.filter(f => f[sortBy] != null);
        const avg = withReturn.length > 0
          ? withReturn.reduce((sum, f) => sum + (f[sortBy] ?? 0), 0) / withReturn.length
          : 0;
        return {
          name,
          shortName: name.replace('基金', '').replace('預設投資-', ''),
          avgReturn: Math.round(avg * 100) / 100,
          count: catFunds.length,
          funds: [...catFunds].sort((a, b) => (b[sortBy] ?? 0) - (a[sortBy] ?? 0)),
        };
      })
      .filter(c => selectedCategory === 'all' || getMainCategory(c.funds[0]) === selectedCategory)
      .sort((a, b) => b.avgReturn - a.avgReturn);
  }, [funds, sortBy, selectedCategory, selectedTrustee]);

  const mainCategories = useMemo(() => {
    if (!funds) return [];
    return [...new Set(funds.map(f => getMainCategory(f)))].sort();
  }, [funds]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">載入中...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">類別比較</h1>
        <p className="text-sm text-muted-foreground mt-1">
          顯示 {funds?.length || 0} 隻基金 · 按積金局分類篩選
        </p>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <div className="flex flex-wrap gap-2 mb-2">
          {Object.entries(SORT_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSortBy(key as SortPeriod)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                sortBy === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">基金大類</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger><SelectValue placeholder="全部類別" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部類別</SelectItem>
                {mainCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">受託人</label>
            <Select value={selectedTrustee} onValueChange={setSelectedTrustee}>
              <SelectTrigger><SelectValue placeholder="全部受託人" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部受託人</SelectItem>
                {trustees.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Bar chart */}
      {categoryData.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">各類別平均回報</h3>
            </div>
            <span className="text-xs text-muted-foreground">{SORT_LABELS[sortBy]}</span>
          </div>
          <div style={{ height: Math.max(200, categoryData.length * 30) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData.slice(0, 15)} layout="vertical" margin={{ left: 100, right: 30 }}>
                <XAxis type="number" tickFormatter={v => `${v}%`} fontSize={11} stroke="hsl(215, 16%, 47%)" />
                <YAxis type="category" dataKey="shortName" fontSize={11} stroke="hsl(215, 16%, 47%)" width={95} />
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
                  {categoryData.slice(0, 15).map((entry, i) => (
                    <Cell key={i} fill={entry.avgReturn >= 0 ? 'hsl(142, 71%, 45%)' : 'hsl(0, 84%, 60%)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Expandable categories */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">展開查看基金</h3>
          <span className="text-xs text-muted-foreground">{SORT_LABELS[sortBy]}</span>
        </div>
        <div className="space-y-2">
          {categoryData.map((cat) => (
            <div key={cat.name} className="bg-card rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === cat.name ? null : cat.name)}
                className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
              >
                <div>
                  <div className="font-medium text-foreground text-sm">{cat.name}</div>
                  <div className="text-xs text-muted-foreground">{cat.count} 隻基金</div>
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
                        <th className="text-right px-4 py-2 font-medium text-muted-foreground">FER</th>
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
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {fund.trustee_name} · {fund.scheme_name}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                            {fund.fee_ratio != null ? `${fund.fee_ratio.toFixed(2)}%` : '-'}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <ReturnValue value={fund[sortBy]} />
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
