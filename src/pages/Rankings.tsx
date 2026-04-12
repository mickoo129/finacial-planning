import { useState, useMemo, useCallback } from 'react';
import { ReturnValue } from '@/components/ReturnValue';
import { useMpfFunds, MpfFund } from '@/hooks/useMpfFunds';
import { CascadingFundFilter } from '@/components/CascadingFundFilter';
import { ReturnField, RETURN_LABELS, RETURN_FIELDS } from '@/lib/returnFields';
import { TrendingUp, TrendingDown, RefreshCw, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getTrusteeFromPlanId } from '@/lib/trusteeMap';

export default function Rankings() {
  const [sortBy, setSortBy] = useState<ReturnField>('return_1y');
  const { data: funds, isLoading, refetch } = useMpfFunds();
  const [scraping, setScraping] = useState(false);
  const { toast } = useToast();
  const [cascadeFiltered, setCascadeFiltered] = useState<MpfFund[]>([]);

  const handleFilterChange = useCallback((filtered: MpfFund[]) => {
    setCascadeFiltered(filtered);
  }, []);

  const hasRealData = funds && funds.length > 0;
  const displayFunds = cascadeFiltered.length > 0 || !hasRealData ? cascadeFiltered : (funds || []);

  const { topFunds, bottomFunds } = useMemo(() => {
    const sorted = [...displayFunds]
      .filter(f => f[sortBy] != null)
      .sort((a, b) => (b[sortBy] ?? 0) - (a[sortBy] ?? 0));
    const topCount = Math.min(sorted.length, 10);
    const bottomCount = Math.min(sorted.length, 10);
    return {
      topFunds: sorted.slice(0, topCount),
      bottomFunds: [...sorted.slice(-bottomCount)].reverse(),
    };
  }, [displayFunds, sortBy]);

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

  const handleScrapeDetail = async () => {
    setScraping(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-mpfa-data');
      if (error) throw error;
      toast({ title: 'MPFA 數據更新', description: `已抓取 ${data?.total_parsed ?? 0} 隻基金（${data?.matched ?? 0} 配對，${data?.new_funds ?? 0} 新增）` });
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
    <div className="glass-card rounded-3xl shadow-[0_8px_30px_-12px_hsl(230_60%_70%/0.15)] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border/60 flex items-center gap-2">
        <div className={`w-1.5 h-5 rounded-full ${colorClass}`} />
        <Icon className={`h-4 w-4 ${colorClass === 'bg-positive' ? 'text-positive' : 'text-negative'}`} />
        <h2 className="font-semibold text-foreground text-sm">{title}（{RETURN_LABELS[sortBy]}）</h2>
        <span className="text-[10px] text-muted-foreground ml-auto">{data.length} 隻基金</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full banking-table min-w-[600px]">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30">
              <th className="text-left px-5 py-2 text-muted-foreground w-8">#</th>
              <th className="text-left px-5 py-2 text-muted-foreground">基金</th>
              <th className="text-left px-5 py-2 text-muted-foreground">受託人</th>
              <th className="text-left px-5 py-2 text-muted-foreground">類別</th>
              <th className="text-right px-5 py-2 text-muted-foreground">回報率</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {data.map((fund, i) => {
              const trustee = fund.trustee_name || getTrusteeFromPlanId(fund.etnet_plan_id);
              return (
                <tr key={fund.etnet_fund_id} className="group">
                  <td className="px-5 py-2.5">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      i < 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-5 py-2.5">
                    <div className="font-medium text-foreground text-sm leading-tight max-w-[220px] truncate">{fund.name_zh || fund.name}</div>
                  </td>
                  <td className="px-5 py-2.5">
                    <span className="text-xs text-muted-foreground">{trustee}</span>
                  </td>
                  <td className="px-5 py-2.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground">{fund.sub_category || fund.category || '未分類'}</span>
                  </td>
                  <td className="px-5 py-2.5 text-right">
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
                {displayFunds.length} / {funds.length} 隻基金 · 數據截至 {dataDate}
              </>
            ) : (
              '暫無數據 · 點擊「更新數據」獲取 etnet 數據'
            )}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleScrapeDetail}
            disabled={scraping}
            className="text-[11px] h-8 rounded-2xl"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${scraping ? 'animate-spin' : ''}`} />
            {scraping ? '更新中...' : 'MPFA 數據'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleScrape}
            disabled={scraping}
            className="text-[11px] h-8 rounded-2xl"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${scraping ? 'animate-spin' : ''}`} />
            {scraping ? '更新中...' : '更新數據'}
          </Button>
        </div>
      </div>

      {/* Cascading filter */}
      {hasRealData && (
        <div className="glass-card rounded-3xl p-4">
          <CascadingFundFilter funds={funds} onFilteredFundsChange={handleFilterChange} />
        </div>
      )}

      {/* Period selector */}
      <div className="flex flex-wrap gap-1 bg-white/70 backdrop-blur-xl rounded-2xl border border-border p-1.5">
        {RETURN_FIELDS.map(key => (
          <button
            key={key}
            onClick={() => setSortBy(key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              sortBy === key
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {RETURN_LABELS[key]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="glass-card rounded-3xl p-12 text-center">
          <RefreshCw className="h-6 w-6 text-muted-foreground/30 mx-auto mb-3 animate-spin" />
          <p className="text-muted-foreground text-xs">載入中...</p>
        </div>
      ) : !hasRealData ? (
        <div className="glass-card rounded-3xl p-12 text-center">
          <Database className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm mb-2">暫無基金數據</p>
          <p className="text-muted-foreground text-xs">點擊上方「更新數據」按鈕從 etnet 抓取最新排名</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <RankingTable title="表現最佳 Top 10" icon={TrendingUp} data={topFunds} colorClass="bg-positive" />
          <RankingTable title="表現最差 Bottom 10" icon={TrendingDown} data={bottomFunds} colorClass="bg-negative" />
        </div>
      )}
    </div>
  );
}
