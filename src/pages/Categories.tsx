import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TimePeriodSelector } from '@/components/TimePeriodSelector';
import { ReturnValue } from '@/components/ReturnValue';
import { TimePeriod } from '@/types/mpf';
import { getCategories, getFundsByCategory, getAllFunds } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Categories() {
  const [period, setPeriod] = useState<TimePeriod>('ytd');
  const [expanded, setExpanded] = useState<string | null>(null);

  const categories = useMemo(() => getCategories(), []);

  const categoryData = useMemo(() => {
    return categories.map(cat => {
      const funds = getFundsByCategory(cat);
      const avg = funds.reduce((sum, f) => sum + f.returns[period], 0) / funds.length;
      return { name: cat, avgReturn: avg, count: funds.length, funds: [...funds].sort((a, b) => b.returns[period] - a.returns[period]) };
    }).sort((a, b) => b.avgReturn - a.avgReturn);
  }, [categories, period]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">基金類型比較</h1>
        <p className="text-sm text-muted-foreground">各類型基金平均回報及排名</p>
      </div>

      <TimePeriodSelector selected={period} onChange={setPeriod} />

      <div className="space-y-3">
        {categoryData.map((cat, i) => (
          <Card key={cat.name}>
            <button
              onClick={() => setExpanded(expanded === cat.name ? null : cat.name)}
              className="w-full text-left"
            >
              <CardHeader className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-muted-foreground bg-secondary rounded-full w-6 h-6 flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div>
                      <CardTitle className="text-base">{cat.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{cat.count} 隻基金</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">平均回報</div>
                      <ReturnValue value={cat.avgReturn} />
                    </div>
                    {expanded === cat.name ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>
            </button>

            {expanded === cat.name && (
              <CardContent className="pt-0 p-0">
                <div className="border-t border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left px-4 py-2 font-medium">基金</th>
                        <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">受托人</th>
                        <th className="text-right px-4 py-2 font-medium">回報率</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cat.funds.map(fund => (
                        <tr key={fund.id} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                          <td className="px-4 py-2.5">
                            <Link to={`/fund/${fund.id}`} className="text-primary hover:underline text-sm">
                              {fund.name}
                            </Link>
                            <div className="text-xs text-muted-foreground mt-0.5 sm:hidden">{fund.trustee}</div>
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell">{fund.trustee}</td>
                          <td className="px-4 py-2.5 text-right">
                            <ReturnValue value={fund.returns[period]} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
