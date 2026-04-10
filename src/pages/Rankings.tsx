import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TimePeriodSelector } from '@/components/TimePeriodSelector';
import { ReturnValue } from '@/components/ReturnValue';
import { TimePeriod } from '@/types/mpf';
import { getTopFunds, getBottomFunds, getAllFunds } from '@/data/mockData';
import { useMpfFunds } from '@/hooks/useMpfFunds';
import { TrendingUp, TrendingDown, ChevronRight, RefreshCw, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type SortPeriod = 'return_ytd' | 'return_3m' | 'return_1y' | 'return_3y';

const SORT_LABELS: Record<SortPeriod, string> = {
  return_ytd: '年初至今',
  return_3m: '3個月',
  return_1y: '1年',
  return_3y: '3年',
};

export default function Rankings() {
  const [sortBy, setSortBy] = useState<SortPeriod>('return_1y');
  const { data: funds, isLoading, refetch } = useMpfFunds();
  const [scraping, setScraping] = useState(false);
  const { toast } = useToast();

  const hasRealData = funds && funds.length > 0;

  // Fallback to mock data if no real data
  const [mockPeriod, setMockPeriod] = useState<TimePeriod>('1y');
  const topMock = useMemo(() => getTopFunds(mockPeriod), [mockPeriod]);
  const bottomMock = useMemo(() => getBottomFunds(mockPeriod), [mockPeriod]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">MPF 基金排名</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {hasRealData ? (
              <>
                <Database className="inline h-3 w-3 mr-1" />
                etnet 真實數據 · {funds.length} 隻基金 · 截至 {dataDate}
              </>
            ) : (
              '模擬數據 · 點擊「更新數據」獲取真實 etnet 數據'
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleScrape}
          disabled={scraping}
          className="flex-shrink-0 text-xs"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${scraping ? 'animate-spin' : ''}`} />
          {scraping ? '更新中...' : '更新數據'}
        </Button>
      </div>

      {/* Sort period selector */}
      <div className="bg-card rounded-xl border border-border p-3 sm:p-4">
        <div className="text-xs text-muted-foreground mb-2">排序依據</div>
        {hasRealData ? (
          <div className="flex flex-wrap gap-2">
            {(Object.entries(SORT_LABELS) as [SortPeriod, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  sortBy === key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        ) : (
          <TimePeriodSelector selected={mockPeriod} onChange={setMockPeriod} />
        )}
      </div>

      {isLoading ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <RefreshCw className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3 animate-spin" />
          <p className="text-muted-foreground text-sm">載入中...</p>
        </div>
      ) : (
        <>
          {/* Top 10 */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-border flex items-center gap-2">
              <div className="w-1 h-5 sm:h-6 bg-[hsl(var(--positive))] rounded-full" />
              <TrendingUp className="h-4 sm:h-5 w-4 sm:w-5 text-[hsl(var(--positive))]" />
              <h2 className="font-semibold text-foreground text-sm sm:text-base">
                表現最佳 Top 10（{hasRealData ? SORT_LABELS[sortBy] : (mockPeriod === 'ytd' ? '年初至今' : mockPeriod)}）
              </h2>
            </div>
            <div className="divide-y divide-border">
              {(hasRealData ? topFunds : topMock).map((fund, i) => (
                <Link
                  key={hasRealData ? (fund as any).etnet_fund_id : (fund as any).id}
                  to={hasRealData ? '#' : `/fund/${(fund as any).id}`}
                  className="flex items-center px-3 sm:px-5 py-3 sm:py-4 hover:bg-muted/50 transition-colors group"
                >
                  <span className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold mr-3 sm:mr-4 flex-shrink-0 ${
                    i < 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground text-sm truncate">
                      {hasRealData ? (fund as any).name : (fund as any).name}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {hasRealData ? (
                        <>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {(fund as any).risk_level || '—'}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {(fund as any).category || '—'}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                            {(fund as any).trustee}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {(fund as any).subCategory || (fund as any).category}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="ml-2 sm:ml-4 text-right flex items-center gap-1 sm:gap-2">
                    <ReturnValue
                      value={hasRealData ? (fund as any)[sortBy] : (fund as any).returns?.[mockPeriod]}
                      className="text-base sm:text-lg"
                    />
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Bottom 10 */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-border flex items-center gap-2">
              <div className="w-1 h-5 sm:h-6 bg-[hsl(var(--negative))] rounded-full" />
              <TrendingDown className="h-4 sm:h-5 w-4 sm:w-5 text-[hsl(var(--negative))]" />
              <h2 className="font-semibold text-foreground text-sm sm:text-base">
                表現最差 Bottom 10（{hasRealData ? SORT_LABELS[sortBy] : (mockPeriod === 'ytd' ? '年初至今' : mockPeriod)}）
              </h2>
            </div>
            <div className="divide-y divide-border">
              {(hasRealData ? bottomFunds : bottomMock).map((fund, i) => (
                <Link
                  key={hasRealData ? (fund as any).etnet_fund_id : (fund as any).id}
                  to={hasRealData ? '#' : `/fund/${(fund as any).id}`}
                  className="flex items-center px-3 sm:px-5 py-3 sm:py-4 hover:bg-muted/50 transition-colors group"
                >
                  <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs sm:text-sm font-bold mr-3 sm:mr-4 flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground text-sm truncate">
                      {(fund as any).name}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {hasRealData ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {(fund as any).category || '—'}
                        </span>
                      ) : (
                        <>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                            {(fund as any).trustee}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {(fund as any).subCategory || (fund as any).category}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="ml-2 sm:ml-4 text-right flex items-center gap-1 sm:gap-2">
                    <ReturnValue
                      value={hasRealData ? (fund as any)[sortBy] : (fund as any).returns?.[mockPeriod]}
                      className="text-base sm:text-lg"
                    />
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
