import { useState, useMemo } from 'react';
import { ReturnValue } from '@/components/ReturnValue';
import { TimePeriod, TIME_PERIOD_LABELS } from '@/types/mpf';
import { getAllFunds, getCategories, getSubCategories, TRUSTEES } from '@/data/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, X, GitCompare } from 'lucide-react';
import { Fund } from '@/types/mpf';
import { TimePeriodSelector } from '@/components/TimePeriodSelector';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

const CHART_COLORS = ['hsl(217, 91%, 60%)', 'hsl(142, 71%, 45%)', 'hsl(24, 95%, 53%)', 'hsl(262, 83%, 58%)'];

const CHART_DAYS: Record<TimePeriod, number> = {
  ytd: 365, '3m': 90, '1y': 365, '3y': 1095, '5y': 1825, '10y': 3650,
  '2025': 365, '2024': 365, '2023': 365, '2022': 365, '2021': 365,
};

export default function CompareFunds() {
  const [selectedFunds, setSelectedFunds] = useState<Fund[]>([]);
  const [category, setCategory] = useState('all');
  const [subCategory, setSubCategory] = useState('all');
  const [trustee, setTrustee] = useState('all');
  const [fundId, setFundId] = useState('');
  const [chartPeriod, setChartPeriod] = useState<TimePeriod>('1y');

  const allFunds = useMemo(() => getAllFunds(), []);
  const categories = useMemo(() => getCategories(), []);
  const subCategories = useMemo(() => getSubCategories(), []);

  const filteredFunds = useMemo(() => {
    let funds = allFunds;
    if (category !== 'all') funds = funds.filter(f => f.category === category);
    if (subCategory !== 'all') funds = funds.filter(f => f.subCategory === subCategory);
    if (trustee !== 'all') funds = funds.filter(f => f.trustee === trustee);
    return funds.filter(f => !selectedFunds.find(sf => sf.id === f.id));
  }, [allFunds, category, subCategory, trustee, selectedFunds]);

  const addFund = () => {
    if (!fundId || selectedFunds.length >= 4) return;
    const fund = allFunds.find(f => f.id === fundId);
    if (fund) {
      setSelectedFunds([...selectedFunds, fund]);
      setFundId('');
    }
  };

  const removeFund = (id: string) => {
    setSelectedFunds(selectedFunds.filter(f => f.id !== id));
  };

  const periods: TimePeriod[] = ['ytd', '3m', '1y', '3y', '5y', '10y'];

  // Build chart data: normalize prices to percentage change from start
  const chartData = useMemo(() => {
    if (selectedFunds.length === 0) return [];
    const days = CHART_DAYS[chartPeriod];
    const maxLen = Math.max(...selectedFunds.map(f => f.priceHistory.length));
    const sliceStart = Math.max(0, maxLen - days);

    // Get the longest price history as date reference
    const refFund = selectedFunds.reduce((a, b) => 
      a.priceHistory.length > b.priceHistory.length ? a : b
    );
    const refHistory = refFund.priceHistory.slice(-days);

    return refHistory.map((entry, i) => {
      const point: Record<string, string | number> = { date: entry.date };
      for (const fund of selectedFunds) {
        const history = fund.priceHistory.slice(-days);
        if (i < history.length) {
          const basePrice = history[0].price;
          point[fund.id] = Math.round(((history[i].price - basePrice) / basePrice) * 10000) / 100;
        }
      }
      return point;
    });
  }, [selectedFunds, chartPeriod]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">比較基金</h1>
        <p className="text-sm text-muted-foreground mt-1">最多比較 4 隻基金 · 按積金局 4 維分類選擇</p>
      </div>

      {/* Selection panel */}
      <div className="bg-card rounded-xl border border-border p-4 sm:p-5 space-y-4">
        <div className="text-sm font-medium text-muted-foreground">選擇基金（最多 4 隻）</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">① 基金類別</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="全部類別" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部類別</SelectItem>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">② 基金種類</label>
            <Select value={subCategory} onValueChange={setSubCategory}>
              <SelectTrigger><SelectValue placeholder="先選基金類別" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部種類</SelectItem>
                {subCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">③ 受託人</label>
            <Select value={trustee} onValueChange={setTrustee}>
              <SelectTrigger><SelectValue placeholder="全部受託人" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部受託人</SelectItem>
                {TRUSTEES.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">④ 基金</label>
          <div className="flex gap-2">
            <Select value={fundId} onValueChange={setFundId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={`選擇基金 (${filteredFunds.length} 隻)`} />
              </SelectTrigger>
              <SelectContent>
                {filteredFunds.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          onClick={addFund}
          disabled={!fundId || selectedFunds.length >= 4}
          className="w-full"
          size="lg"
        >
          <Plus className="h-4 w-4 mr-2" /> 加入比較
        </Button>
      </div>

      {/* Selected fund chips */}
      {selectedFunds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedFunds.map((f, i) => (
            <div
              key={f.id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border"
              style={{ borderColor: CHART_COLORS[i], color: CHART_COLORS[i] }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />
              <span className="max-w-[120px] sm:max-w-[200px] truncate">{f.name}</span>
              <button onClick={() => removeFund(f.id)} className="hover:opacity-70">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedFunds.length > 0 ? (
        <>
          {/* Trend chart comparison */}
          <div className="bg-card rounded-xl border border-border p-4 sm:p-5">
            <h3 className="font-semibold text-foreground mb-3">走勢比較（%）</h3>
            <TimePeriodSelector selected={chartPeriod} onChange={setChartPeriod} />
            <div className="h-[250px] sm:h-[350px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => d?.slice(5) || ''}
                    stroke="hsl(215, 16%, 47%)"
                    fontSize={10}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    stroke="hsl(215, 16%, 47%)"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={v => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(0, 0%, 100%)',
                      border: '1px solid hsl(214, 32%, 91%)',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                    formatter={(value: number, name: string) => {
                      const fund = selectedFunds.find(f => f.id === name);
                      return [`${value.toFixed(2)}%`, fund?.name || name];
                    }}
                    labelFormatter={(label) => label}
                  />
                  {selectedFunds.map((fund, i) => (
                    <Line
                      key={fund.id}
                      type="monotone"
                      dataKey={fund.id}
                      stroke={CHART_COLORS[i]}
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Comparison table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-3 sm:px-4 py-3 font-medium text-muted-foreground min-w-[80px] sm:min-w-[120px]">項目</th>
                    {selectedFunds.map((f, i) => (
                      <th key={f.id} className="text-center px-2 sm:px-4 py-3 font-medium min-w-[110px] sm:min-w-[150px]">
                        <div className="flex items-center justify-between">
                          <div className="text-left flex-1 min-w-0">
                            <div className="text-foreground text-xs truncate">{f.name}</div>
                            <div className="text-[10px] text-muted-foreground truncate">{f.trustee}</div>
                          </div>
                          <button onClick={() => removeFund(f.id)} className="text-muted-foreground hover:text-destructive ml-1 flex-shrink-0">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-3 sm:px-4 py-2.5 text-muted-foreground text-xs">類型</td>
                    {selectedFunds.map(f => (
                      <td key={f.id} className="px-2 sm:px-4 py-2.5 text-center text-xs">{f.subCategory || f.category}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-3 sm:px-4 py-2.5 text-muted-foreground text-xs">風險</td>
                    {selectedFunds.map(f => (
                      <td key={f.id} className="px-2 sm:px-4 py-2.5 text-center text-xs">{f.riskLevel}/7</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-3 sm:px-4 py-2.5 text-muted-foreground text-xs">管理費</td>
                    {selectedFunds.map(f => (
                      <td key={f.id} className="px-2 sm:px-4 py-2.5 text-center text-xs">{f.managementFee}%</td>
                    ))}
                  </tr>
                  {periods.map(p => (
                    <tr key={p}>
                      <td className="px-3 sm:px-4 py-2.5 text-muted-foreground text-xs">{TIME_PERIOD_LABELS[p]}</td>
                      {selectedFunds.map(f => (
                        <td key={f.id} className="px-2 sm:px-4 py-2.5 text-center">
                          <ReturnValue value={f.returns[p]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-card rounded-xl border border-border p-8 sm:p-12 text-center">
          <GitCompare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">按上方步驟選擇基金開始比較</p>
          <p className="text-xs text-muted-foreground mt-1">① 基金類別 → ② 基金種類 → ③ 受託人 → ④ 基金</p>
        </div>
      )}
    </div>
  );
}
