import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFundById } from '@/data/mockData';
import { TIME_PERIOD_LABELS, TimePeriod } from '@/types/mpf';
import { ReturnValue } from '@/components/ReturnValue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useState } from 'react';
import { TimePeriodSelector } from '@/components/TimePeriodSelector';

const CHART_DAYS: Record<TimePeriod, number> = {
  daily: 30, weekly: 90, monthly: 180, mtd: 30, ytd: 365,
  '3m': 90, '6m': 180, '1y': 365, '3y': 1095, '5y': 1825, '10y': 3650,
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

      <div>
        <h1 className="text-xl font-bold text-foreground">{fund.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">{fund.trustee} · {fund.category}</p>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '風險級別', value: `${fund.riskLevel}/7` },
          { label: '管理費', value: `${fund.managementFee}%` },
          { label: '最新價格', value: `$${fund.priceHistory[fund.priceHistory.length - 1].price.toFixed(3)}` },
          { label: '年至今', value: null, returnVal: fund.returns.ytd },
        ].map((item, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">{item.label}</div>
              {item.returnVal !== undefined ? (
                <ReturnValue value={item.returnVal} className="text-lg" />
              ) : (
                <div className="text-lg font-semibold text-foreground mt-0.5">{item.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">價格走勢</CardTitle>
          <div className="mt-2">
            <TimePeriodSelector selected={chartPeriod} onChange={setChartPeriod} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isPositive ? 'hsl(142, 71%, 45%)' : 'hsl(0, 84%, 60%)'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={isPositive ? 'hsl(142, 71%, 45%)' : 'hsl(0, 84%, 60%)'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => d.slice(5)}
                  stroke="hsl(215, 20%, 55%)"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="hsl(215, 20%, 55%)"
                  fontSize={11}
                  tickLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(222, 47%, 8%)',
                    border: '1px solid hsl(217, 33%, 17%)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'hsl(210, 40%, 95%)',
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
        </CardContent>
      </Card>

      {/* All period returns */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">各時段回報率</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left px-4 py-2 font-medium">時段</th>
                  <th className="text-right px-4 py-2 font-medium">回報率</th>
                </tr>
              </thead>
              <tbody>
                {(Object.entries(TIME_PERIOD_LABELS) as [TimePeriod, string][]).map(([key, label]) => (
                  <tr key={key} className="border-b border-border/50">
                    <td className="px-4 py-2.5 text-muted-foreground">{label}</td>
                    <td className="px-4 py-2.5 text-right">
                      <ReturnValue value={fund.returns[key]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
