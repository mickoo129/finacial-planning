import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TimePeriodSelector } from '@/components/TimePeriodSelector';
import { ReturnValue } from '@/components/ReturnValue';
import { TimePeriod } from '@/types/mpf';
import { getTopFunds, getBottomFunds, getAllFunds } from '@/data/mockData';
import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';

export default function Rankings() {
  const [period, setPeriod] = useState<TimePeriod>('1y');

  const topFunds = useMemo(() => getTopFunds(period), [period]);
  const bottomFunds = useMemo(() => getBottomFunds(period), [period]);
  const totalFunds = useMemo(() => getAllFunds().length, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">MPF 基金排名</h1>
        <p className="text-sm text-muted-foreground mt-1">
          真實 etnet 數據 · 點擊查看基金詳情
        </p>
      </div>

      <div className="bg-card rounded-xl border border-border p-4">
        <div className="text-xs text-muted-foreground mb-3">時間段</div>
        <TimePeriodSelector selected={period} onChange={setPeriod} />
      </div>

      {/* Top 10 */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <div className="w-1 h-6 bg-[hsl(var(--positive))] rounded-full" />
          <TrendingUp className="h-5 w-5 text-[hsl(var(--positive))]" />
          <h2 className="font-semibold text-foreground">
            表現最佳 Top 10（{period === 'ytd' ? '年初至今' : period}）
          </h2>
        </div>
        <div className="divide-y divide-border">
          {topFunds.map((fund, i) => (
            <Link
              key={fund.id}
              to={`/fund/${fund.id}`}
              className="flex items-center px-5 py-4 hover:bg-muted/50 transition-colors group"
            >
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold mr-4 flex-shrink-0 ${
                i < 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground truncate">{fund.name}</div>
                {fund.nameEn && (
                  <div className="text-xs text-muted-foreground truncate mt-0.5">{fund.nameEn}</div>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                    {fund.trustee}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    {fund.subCategory || fund.category}
                  </span>
                </div>
              </div>
              <div className="ml-4 text-right flex items-center gap-2">
                <ReturnValue value={fund.returns[period]} className="text-lg" />
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom 10 */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <div className="w-1 h-6 bg-[hsl(var(--negative))] rounded-full" />
          <TrendingDown className="h-5 w-5 text-[hsl(var(--negative))]" />
          <h2 className="font-semibold text-foreground">
            表現最差 Bottom 10（{period === 'ytd' ? '年初至今' : period}）
          </h2>
        </div>
        <div className="divide-y divide-border">
          {bottomFunds.map((fund, i) => (
            <Link
              key={fund.id}
              to={`/fund/${fund.id}`}
              className="flex items-center px-5 py-4 hover:bg-muted/50 transition-colors group"
            >
              <span className="w-7 h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-bold mr-4 flex-shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground truncate">{fund.name}</div>
                {fund.nameEn && (
                  <div className="text-xs text-muted-foreground truncate mt-0.5">{fund.nameEn}</div>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                    {fund.trustee}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    {fund.subCategory || fund.category}
                  </span>
                </div>
              </div>
              <div className="ml-4 text-right flex items-center gap-2">
                <ReturnValue value={fund.returns[period]} className="text-lg" />
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
