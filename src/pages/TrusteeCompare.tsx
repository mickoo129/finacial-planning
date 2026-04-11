import { useState, useMemo } from 'react';
import { ReturnValue } from '@/components/ReturnValue';
import { useMpfFunds } from '@/hooks/useMpfFunds';
import { getTrusteeFromPlanId } from '@/lib/trusteeMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2 } from 'lucide-react';

type SortPeriod = 'return_ytd' | 'return_1m' | 'return_3m' | 'return_1y' | 'return_3y' | 'return_5y' | 'return_10y';

const SORT_LABELS: Record<SortPeriod, string> = {
  return_ytd: '年初至今',
  return_1m: '1個月',
  return_3m: '3個月',
  return_1y: '1年',
  return_3y: '3年',
  return_5y: '5年',
  return_10y: '10年',
};

export default function TrusteeCompare() {
  const [period, setPeriod] = useState<SortPeriod>('return_1y');
  const { data: funds, isLoading } = useMpfFunds();

  const trusteeGroups = useMemo(() => {
    if (!funds?.length) return [];
    const groups: Record<string, typeof funds> = {};
    for (const fund of funds) {
      const trustee = fund.trustee_name || getTrusteeFromPlanId(fund.etnet_plan_id);
      if (!trustee) continue;
      if (!groups[trustee]) groups[trustee] = [];
      groups[trustee].push(fund);
    }
    return Object.entries(groups)
      .map(([name, groupFunds]) => {
        const validFunds = groupFunds.filter(f => f[period] != null);
        const avg = validFunds.length
          ? validFunds.reduce((s, f) => s + (f[period] ?? 0), 0) / validFunds.length
          : 0;
        // Group by scheme
        const schemeMap = new Map<string, typeof groupFunds>();
        for (const f of groupFunds) {
          const s = f.scheme_name || '未分類';
          if (!schemeMap.has(s)) schemeMap.set(s, []);
          schemeMap.get(s)!.push(f);
        }
        const schemes = [...schemeMap.entries()].map(([schemeName, schemeFunds]) => ({
          name: schemeName,
          funds: [...schemeFunds].sort((a, b) => (b[period] ?? 0) - (a[period] ?? 0)),
          count: schemeFunds.length,
        }));
        return { name, funds: [...groupFunds].sort((a, b) => (b[period] ?? 0) - (a[period] ?? 0)), avg, count: groupFunds.length, schemes };
      })
      .sort((a, b) => b.avg - a.avg);
  }, [funds, period]);

  const [trustee1, setTrustee1] = useState('');
  const [trustee2, setTrustee2] = useState('');
  const [scheme1, setScheme1] = useState('all');
  const [scheme2, setScheme2] = useState('all');

  const t1 = trustee1 || trusteeGroups[0]?.name || '';
  const t2 = trustee2 || trusteeGroups[1]?.name || '';
  const group1 = trusteeGroups.find(g => g.name === t1);
  const group2 = trusteeGroups.find(g => g.name === t2);

  const trusteeNames = trusteeGroups.map(g => g.name);

  const getFilteredFunds = (group: typeof group1, scheme: string) => {
    if (!group) return [];
    if (scheme === 'all') return group.funds;
    return group.funds.filter(f => (f.scheme_name || '未分類') === scheme);
  };

  const funds1 = getFilteredFunds(group1, scheme1);
  const funds2 = getFilteredFunds(group2, scheme2);

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

  const TrusteeCard = ({ group, scheme, setScheme, fundList }: {
    group: NonNullable<typeof group1>;
    scheme: string;
    setScheme: (v: string) => void;
    fundList: typeof funds1;
  }) => (
    <Card className="shadow-sm">
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">{group.name}</CardTitle>
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {fundList.length} 隻基金
            </span>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground">平均回報</div>
            <ReturnValue value={group.avg} className="text-base" />
          </div>
        </div>
        <div className="mt-2">
          <Select value={scheme} onValueChange={setScheme}>
            <SelectTrigger className="h-7 text-[11px]"><SelectValue placeholder="全部計劃" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部計劃</SelectItem>
              {group.schemes.map(s => (
                <SelectItem key={s.name} value={s.name}>{s.name} ({s.count})</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            {fundList.map(fund => (
              <tr key={fund.etnet_fund_id}>
                <td className="px-4 py-2">
                  <div className="text-sm text-foreground leading-tight">{fund.name_zh || fund.name}</div>
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
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-foreground tracking-tight">受托人比較</h1>
        <p className="text-[11px] text-muted-foreground">比較不同受託人旗下基金整體表現，可細分計劃名稱</p>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <Select value={t1} onValueChange={v => { setTrustee1(v); setScheme1('all'); }}>
          <SelectTrigger className="w-full sm:w-44 h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {trusteeNames.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground text-xs self-center font-medium">VS</span>
        <Select value={t2} onValueChange={v => { setTrustee2(v); setScheme2('all'); }}>
          <SelectTrigger className="w-full sm:w-44 h-9 text-xs"><SelectValue /></SelectTrigger>
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
        {group1 && <TrusteeCard group={group1} scheme={scheme1} setScheme={setScheme1} fundList={funds1} />}
        {group2 && <TrusteeCard group={group2} scheme={scheme2} setScheme={setScheme2} fundList={funds2} />}
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
