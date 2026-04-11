import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ReturnValue } from '@/components/ReturnValue';
import { useMpfFunds } from '@/hooks/useMpfFunds';
import { TrendingUp, TrendingDown, RefreshCw, Database, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getTrusteeFromPlanId } from '@/lib/trusteeMap';

type SortPeriod = 'return_ytd' | 'return_3m' | 'return_1y' | 'return_3y' | 'return_5y' | 'return_10y';

const SORT_LABELS: Record<SortPeriod, string> = {
  return_ytd: '年初至今',
  return_3m: '3個月',
  return_1y: '1年',
  return_3y: '3年',
  return_5y: '5年',
  return_10y: '10年',
};

export default function Rankings() {
  const [sortBy, setSortBy] = useState<SortPeriod>('return_1y');
  const { data: funds, isLoading, refetch } = useMpfFunds();
  const [scraping, setScraping] = useState(false);
  const { toast } = useToast();

  const hasRealData = funds && funds.length > 0;

  const topFunds = useMemo(() => {
    if (!hasRealData) return [];
    return [...funds]
      .filter(f => f[sortBy] != null)
      .sort((a, b) => (b[sortBy] ?? 0) - (a[sortBy] ?? 0))
      .slice(0, 10);
  }, [funds, sortBy, hasRealData]);

  const bottomFunds = useMemo(() => {
    if (!hasRealData) return [];
    return [...funds]
      .filter(f => f[sortBy] != null)
      .sort((a, b) => (a[sortBy] ?? 0) - (b[sortBy] ?? 0))
      .slice(0, 10);
  }, [funds, sortBy, hasRealData]);

  const handleScrape = async () => {
    setScraping(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-mpf-ranking');
      if (error) throw error;
      toast({ title: '更新成功', description: `已抓取 ${data.funds_count} 隻基金數據` });
      refetch();
    } catch (e: any) {
      toast({ title: '更新失敗', description: e.message, variant: 'destructive' });
    } finally {
      setScraping(false);
    }
  };

  const dataDate = hasRealData ? funds[0]?.data_date : null;

  const RankingTable = ({ title, icon: Icon, data, colorClass }: {
    title: string;
    icon: any;
    data: any[];
    colorClass: string;
  }) => (
    <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <div className={`w-1 h-5 rounded-full ${colorClass}`} />
        <Icon className={`h-4 w-4 ${colorClass === 'bg-positive' ? 'text-positive' : 'text-negative'}`} />
        <h2 className="font-semibold text-foreground text-sm">{title}（{SORT_LABELS[sortBy]}）</h2>
        <span className="text-[10px] text-muted-foreground ml-auto">{data.length} 隻基金</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full banking-table">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-2 text-muted-foreground w-8">#</th>
              <th className="text-left px-4 py-2 text-muted-foreground">基金</th>
              <th className="text-left px-4 py-2 text-muted-foreground hidden sm:table-cell">受託人</th>
              <th className="text-left px-4 py-2 text-muted-foreground hidden md:table-cell">類別</th>
              <th className="text-right px-4 py-2 text-muted-foreground">回報率</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {data.map((fund, i) => {
              const trustee = fund.trustee_name || getTrusteeFromPlanId(fund.etnet_plan_id);
              return (
                <tr key={fund.etnet_fund_id} className="group">
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${
                      i < 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-foreground text-sm leading-tight">{fund.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 sm:hidden">
                      {trustee} · {fund.category || '—'}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 hidden sm:table-cell">
                    <span className="text-xs text-muted-foreground">{trustee}</span>
                  </td>
                  <td className="px-4 py-2.5 hidden md:table-cell">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{fund.category || '—'}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <ReturnValue value={fund[sortBy] ?? 0} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">MPF 基金排名</h1>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
            {hasRealData ? (
              <>
                <Database className="inline h-3 w-3 mr-1 opacity-50" />
                {funds.length} 隻基金 · 數據截至 {dataDate}
              </>
            ) : (
              '暫無數據 · 點擊「更新數據」獲取 etnet 數據'
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleScrape}
          disabled={scraping}
          className="flex-shrink-0 text-[11px] h-8"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${scraping ? 'animate-spin' : ''}`} />
          {scraping ? '更新中...' : '更新數據'}
        </Button>
      </div>

      {/* Period selector - banking pill style */}
      <div className="flex flex-wrap gap-1 bg-card rounded-lg border border-border p-1.5">
        {(Object.entries(SORT_LABELS) as [SortPeriod, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSortBy(key)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              sortBy === key
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <RefreshCw className="h-6 w-6 text-muted-foreground/30 mx-auto mb-3 animate-spin" />
          <p className="text-muted-foreground text-xs">載入中...</p>
        </div>
      ) : !hasRealData ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <Database className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm mb-2">暫無基金數據</p>
          <p className="text-muted-foreground text-xs">點擊上方「更新數據」按鈕從 etnet 抓取最新排名</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <RankingTable
            title="表現最佳 Top 10"
            icon={TrendingUp}
            data={topFunds}
            colorClass="bg-positive"
          />
          <RankingTable
            title="表現最差 Bottom 10"
            icon={TrendingDown}
            data={bottomFunds}
            colorClass="bg-negative"
          />
        </div>
      )}
    </div>
  );
}
