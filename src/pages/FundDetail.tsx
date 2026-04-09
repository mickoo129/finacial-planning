import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFundById } from '@/data/mockData';
import { TIME_PERIOD_LABELS, TimePeriod } from '@/types/mpf';
import { ReturnValue } from '@/components/ReturnValue';
import { ArrowLeft } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TimePeriodSelector } from '@/components/TimePeriodSelector';

const CHART_DAYS: Record<TimePeriod, number> = {
  ytd: 365, '3m': 90, '1y': 365, '3y': 1095, '5y': 1825, '10y': 3650,
  '2025': 365, '2024': 365, '2023': 365, '2022': 365, '2021': 365,
};

export default function FundDetail() {
  const { id } = useParams<{ id: string }>();
  const fund = useMemo(() => getFundById(id || ''), [id]);
  const [chartPeriod, setChartPeriod] = useState<TimePeriod>('1y');

  if (!fund) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">找不到該基金</p>
        <Link to="/" className="text-primary hover:underline mt-2 inline-block">返回首頁</Link>
      </div>
    );
  }

  const chartData = fund.priceHistory.slice(-CHART_DAYS[chartPeriod]);
  const isPositive = chartData.length > 1 && chartData[chartData.length - 1].price >= chartData[0].price;

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> 返回排名
      </Link>

      <div className="bg-card rounded-xl border border-border p-5">
        <h1 className="text-xl font-bold text-foreground">{fund.name}</h1>
        {fund.nameEn && <p className="text-sm text-muted-foreground mt-0.5">{fund.nameEn}</p>}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">{fund.trustee}</span>
          <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{fund.subCategory || fund.category}</span>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '風險級別', value: `${fund.riskLevel}/7` },
          { label: '管理費 (FER)', value: `${fund.managementFee}%` },
          { label: '最新價格', value: `$${fund.priceHistory[fund.priceHistory.length - 1].price.toFixed(3)}` },
          { label: '年至今', value: null, returnVal: fund.returns.ytd },
        ].map((item, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4">
            <div className="text-xs text-muted-foreground">{item.label}</div>
            {item.returnVal !== undefined ? (
              <ReturnValue value={item.returnVal} className="text-lg" />
            ) : (
              <div className="text-lg font-semibold text-foreground mt-0.5">{item.value}</div>
            )}
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold text-foreground mb-3">價格走勢</h3>
        <TimePeriodSelector selected={chartPeriod} onChange={setChartPeriod} />
        <div className="h-[300px] sm:h-[400px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositive ? 'hsl(142, 71%, 45%)' : 'hsl(0, 84%, 60%)'} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={isPositive ? 'hsl(142, 71%, 45%)' : 'hsl(0, 84%, 60%)'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
              <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} stroke="hsl(215, 16%, 47%)" fontSize={11} tickLine={false} />
              <YAxis stroke="hsl(215, 16%, 47%)" fontSize={11} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(0, 0%, 100%)',
                  border: '1px solid hsl(214, 32%, 91%)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`$${value.toFixed(3)}`, '價格']}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={isPositive ? 'hsl(142, 71%, 45%)' : 'hsl(0, 84%, 60%)'}
                fill="url(#colorPrice)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* All period returns */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">各時段回報率</h3>
        </div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-border">
            {(Object.entries(TIME_PERIOD_LABELS) as [TimePeriod, string][]).map(([key, label]) => (
              <tr key={key} className="hover:bg-muted/30">
                <td className="px-5 py-3 text-muted-foreground">{label}</td>
                <td className="px-5 py-3 text-right">
                  <ReturnValue value={fund.returns[key]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
