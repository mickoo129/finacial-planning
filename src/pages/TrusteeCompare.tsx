import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TimePeriodSelector } from '@/components/TimePeriodSelector';
import { ReturnValue } from '@/components/ReturnValue';
import { TimePeriod } from '@/types/mpf';
import { TRUSTEES, getFundsByTrustee } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TrusteeCompare() {
  const [period, setPeriod] = useState<TimePeriod>('ytd');
  const [trustee1, setTrustee1] = useState(TRUSTEES[0].name);
  const [trustee2, setTrustee2] = useState(TRUSTEES[1].name);

  const funds1 = useMemo(() =>
    [...getFundsByTrustee(trustee1)].sort((a, b) => b.returns[period] - a.returns[period]),
    [trustee1, period]
  );
  const funds2 = useMemo(() =>
    [...getFundsByTrustee(trustee2)].sort((a, b) => b.returns[period] - a.returns[period]),
    [trustee2, period]
  );

  const avg1 = funds1.length ? funds1.reduce((s, f) => s + f.returns[period], 0) / funds1.length : 0;
  const avg2 = funds2.length ? funds2.reduce((s, f) => s + f.returns[period], 0) / funds2.length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">受托人比較</h1>
        <p className="text-sm text-muted-foreground">選擇兩間受托人比較旗下基金表現</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={trustee1} onValueChange={setTrustee1}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TRUSTEES.map(t => (
              <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground self-center text-sm">vs</span>
        <Select value={trustee2} onValueChange={setTrustee2}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TRUSTEES.map(t => (
              <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <TimePeriodSelector selected={period} onChange={setPeriod} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[
          { name: trustee1, funds: funds1, avg: avg1 },
          { name: trustee2, funds: funds2, avg: avg2 },
        ].map(({ name, funds, avg }) => (
          <Card key={name}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{name}</CardTitle>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">平均回報</div>
                  <ReturnValue value={avg} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left px-4 py-2 font-medium">基金</th>
                      <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">類型</th>
                      <th className="text-right px-4 py-2 font-medium">回報率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {funds.map(fund => (
                      <tr key={fund.id} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                        <td className="px-4 py-2.5">
                          <Link to={`/fund/${fund.id}`} className="text-primary hover:underline text-sm">
                            {fund.name}
                          </Link>
                          <div className="text-xs text-muted-foreground mt-0.5 sm:hidden">{fund.category}</div>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground hidden sm:table-cell">{fund.category}</td>
                        <td className="px-4 py-2.5 text-right">
                          <ReturnValue value={fund.returns[period]} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
