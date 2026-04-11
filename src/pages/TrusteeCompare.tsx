import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ReturnValue } from '@/components/ReturnValue';
import { useMpfFunds } from '@/hooks/useMpfFunds';
import { getTrusteeFromPlanId, getSchemeFromPlanId, PLAN_TRUSTEE_MAP } from '@/lib/trusteeMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, ChevronDown, ChevronUp } from 'lucide-react';

type SortPeriod = 'return_ytd' | 'return_3m' | 'return_1y' | 'return_3y' | 'return_5y' | 'return_10y';

const SORT_LABELS: Record<SortPeriod, string> = {
  return_ytd: '年初至今',
  return_3m: '3個月',
  return_1y: '1年',
  return_3y: '3年',
  return_5y: '5年',
  return_10y: '10年',
};

export default function TrusteeCompare() {
  const [period, setPeriod] = useState<SortPeriod>('return_1y');
  const { data: funds, isLoading } = useMpfFunds();

  // Get unique trustees from real data
  const trusteeGroups = useMemo(() => {
    if (!funds?.length) return [];
    const groups: Record<string, typeof funds> = {};
    for (const fund of funds) {
      const trustee = fund.trustee_name || getTrusteeFromPlanId(fund.etnet_plan_id);
      if (!trustee) continue;
      if (!groups[trustee]) groups[trustee] = [];
      groups[trustee].push(fund);
    }
    // Sort by average return
    return Object.entries(groups)
      .map(([name, groupFunds]) => {
        const validFunds = groupFunds.filter(f => f[period] != null);
        const avg = validFunds.length
          ? validFunds.reduce((s, f) => s + (f[period] ?? 0), 0) / validFunds.length
          : 0;
        return {
          name,
          funds: [...groupFunds].sort((a, b) => (b[period] ?? 0) - (a[period] ?? 0)),
          avg,
          count: groupFunds.length,
        };
      })
      .sort((a, b) => b.avg - a.avg);
  }, [funds, period]);

  const [trustee1, setTrustee1] = useState('');
  const [trustee2, setTrustee2] = useState('');

  // Auto-select first two trustees
  const t1 = trustee1 || trusteeGroups[0]?.name || '';
  const t2 = trustee2 || trusteeGroups[1]?.name || '';
  const group1 = trusteeGroups.find(g => g.name === t1);
  const group2 = trusteeGroups.find(g => g.name === t2);

  const trusteeNames = trusteeGroups.map(g => g.name);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!funds?.length) {
    return (
      <div className="text-center py-20 text-muted-foreground text-sm">
        暫無數據，請先在排名頁面更新數據
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-foreground tracking-tight">受託人比較</h1>
        <p className="text-[11px] text-muted-foreground">比較不同受託人旗下基金整體表現</p>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <Select value={t1} onValueChange={setTrustee1}>
          <SelectTrigger className="w-full sm:w-44 h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {trusteeNames.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground text-xs self-center font-medium">VS</span>
        <Select value={t2} onValueChange={setTrustee2}>
          <SelectTrigger className="w-full sm:w-44 h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {trusteeNames.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex gap-1 sm:ml-auto bg-card rounded-lg border border-border p-1">
          {(Object.entries(SORT_LABELS) as [SortPeriod, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                period === key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[group1, group2].filter(Boolean).map((group) => (
          <Card key={group!.name} className="shadow-sm">
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">{group!.name}</CardTitle>
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {group!.count} 隻基金
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-muted-foreground">平均回報</div>
                  <ReturnValue value={group!.avg} className="text-base" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full banking-table">
                <thead>
                  <tr className="border-y border-border bg-muted/30">
                    <th className="text-left px-4 py-1.5 text-muted-foreground">基金</th>
                    <th className="text-left px-4 py-1.5 text-muted-foreground hidden sm:table-cell">類別</th>
                    <th className="text-right px-4 py-1.5 text-muted-foreground">回報率</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {group!.funds.map(fund => (
                    <tr key={fund.etnet_fund_id}>
                      <td className="px-4 py-2">
                        <div className="text-sm text-foreground leading-tight">{fund.name}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 sm:hidden">{fund.category}</div>
                      </td>
                      <td className="px-4 py-2 hidden sm:table-cell">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{fund.category}</span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <ReturnValue value={fund[period]} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* All trustees overview */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-sm">全部受託人排名（{SORT_LABELS[period]} 平均回報）</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full banking-table">
            <thead>
              <tr className="border-y border-border bg-muted/30">
                <th className="text-left px-4 py-1.5 text-muted-foreground w-8">#</th>
                <th className="text-left px-4 py-1.5 text-muted-foreground">受託人</th>
                <th className="text-center px-4 py-1.5 text-muted-foreground">基金數目</th>
                <th className="text-right px-4 py-1.5 text-muted-foreground">平均回報</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {trusteeGroups.map((group, i) => (
                <tr key={group.name}>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-2 text-sm font-medium text-foreground">{group.name}</td>
                  <td className="px-4 py-2 text-center text-xs text-muted-foreground">{group.count}</td>
                  <td className="px-4 py-2 text-right">
                    <ReturnValue value={group.avg} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
