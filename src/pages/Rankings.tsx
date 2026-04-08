import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TimePeriodSelector } from '@/components/TimePeriodSelector';
import { ReturnValue } from '@/components/ReturnValue';
import { TimePeriod } from '@/types/mpf';
import { getTopFunds, getBottomFunds } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function Rankings() {
  const [period, setPeriod] = useState<TimePeriod>('ytd');

  const topFunds = useMemo(() => getTopFunds(period), [period]);
  const bottomFunds = useMemo(() => getBottomFunds(period), [period]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">強積金排名</h1>
        <p className="text-sm text-muted-foreground">按回報率排列的頭十名及尾十名基金</p>
      </div>

      <TimePeriodSelector selected={period} onChange={setPeriod} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-positive text-lg">
              <TrendingUp className="h-5 w-5" />
              頭十名
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left px-4 py-2 font-medium">#</th>
                    <th className="text-left px-4 py-2 font-medium">基金名稱</th>
                    <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">受托人</th>
                    <th className="text-right px-4 py-2 font-medium">回報率</th>
                  </tr>
                </thead>
                <tbody>
                  {topFunds.map((fund, i) => (
                    <tr key={fund.id} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3">
                        <Link to={`/fund/${fund.id}`} className="text-primary hover:underline font-medium">
                          {fund.name}
                        </Link>
                        <div className="text-xs text-muted-foreground mt-0.5 sm:hidden">{fund.trustee}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{fund.trustee}</td>
                      <td className="px-4 py-3 text-right">
                        <ReturnValue value={fund.returns[period]} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Bottom 10 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-negative text-lg">
              <TrendingDown className="h-5 w-5" />
              尾十名
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left px-4 py-2 font-medium">#</th>
                    <th className="text-left px-4 py-2 font-medium">基金名稱</th>
                    <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">受托人</th>
                    <th className="text-right px-4 py-2 font-medium">回報率</th>
                  </tr>
                </thead>
                <tbody>
                  {bottomFunds.map((fund, i) => (
                    <tr key={fund.id} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3">
                        <Link to={`/fund/${fund.id}`} className="text-primary hover:underline font-medium">
                          {fund.name}
                        </Link>
                        <div className="text-xs text-muted-foreground mt-0.5 sm:hidden">{fund.trustee}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{fund.trustee}</td>
                      <td className="px-4 py-3 text-right">
                        <ReturnValue value={fund.returns[period]} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
