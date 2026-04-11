import { useState, useMemo, useCallback } from 'react';
import { ReturnValue } from '@/components/ReturnValue';
import { useMpfFunds, MpfFund } from '@/hooks/useMpfFunds';
import { CascadingFundFilter } from '@/components/CascadingFundFilter';
import { Input } from '@/components/ui/input';
import { Search, ArrowUpDown, RefreshCw, Database } from 'lucide-react';

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

export default function SearchFunds() {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortPeriod>('return_1y');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const { data: funds, isLoading } = useMpfFunds();
  const [cascadeFiltered, setCascadeFiltered] = useState<MpfFund[]>([]);

  const handleFilterChange = useCallback((filtered: MpfFund[]) => {
    setCascadeFiltered(filtered);
  }, []);

  const filteredFunds = useMemo(() => {
    let result = [...cascadeFiltered];
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(f => f.name.toLowerCase().includes(q) || (f.name_zh && f.name_zh.toLowerCase().includes(q)));
    }
    result.sort((a, b) => {
      const av = a[sortBy] ?? -9999;
      const bv = b[sortBy] ?? -9999;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
    return result;
  }, [cascadeFiltered, query, sortBy, sortDir]);

  const toggleSort = (field: SortPeriod) => {
    if (sortBy === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(field); setSortDir('desc'); }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground/30" />
      </div>
    );
  }

  if (!funds?.length) {
    return (
      <div className="text-center py-20 text-muted-foreground text-sm">
        <Database className="h-8 w-8 mx-auto mb-3 opacity-20" />
        暫無數據，請先在排名頁面更新數據
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-foreground tracking-tight">基金搜尋</h1>
        <p className="text-[11px] text-muted-foreground">{filteredFunds.length} / {funds.length} 隻基金</p>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border border-border p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜尋基金名稱..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 h-9 text-sm"
          />
        </div>
        <CascadingFundFilter funds={funds} onFilteredFundsChange={handleFilterChange} />
        <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
          {(Object.entries(SORT_LABELS) as [SortPeriod, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => toggleSort(key)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all flex-1 ${
                sortBy === key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Results table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full banking-table">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-3 py-2 text-muted-foreground w-8">#</th>
                <th className="text-left px-3 py-2 text-muted-foreground">基金名稱</th>
                <th className="text-left px-3 py-2 text-muted-foreground hidden md:table-cell">受託人</th>
                <th className="text-left px-3 py-2 text-muted-foreground hidden lg:table-cell">類別</th>
                <th className="text-right px-3 py-2 text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => toggleSort('return_ytd')}>
                  <span className="inline-flex items-center gap-0.5">YTD <ArrowUpDown className="h-2.5 w-2.5" /></span>
                </th>
                <th className="text-right px-3 py-2 text-muted-foreground hidden sm:table-cell cursor-pointer hover:text-foreground" onClick={() => toggleSort('return_1y')}>
                  <span className="inline-flex items-center gap-0.5">1年 <ArrowUpDown className="h-2.5 w-2.5" /></span>
                </th>
                <th className="text-right px-3 py-2 text-muted-foreground hidden lg:table-cell cursor-pointer hover:text-foreground" onClick={() => toggleSort('return_3y')}>
                  <span className="inline-flex items-center gap-0.5">3年 <ArrowUpDown className="h-2.5 w-2.5" /></span>
                </th>
                <th className="text-right px-3 py-2 text-muted-foreground hidden xl:table-cell">FER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredFunds.map((fund, i) => (
                <tr key={fund.id || fund.etnet_fund_id}>
                  <td className="px-3 py-2 text-[10px] text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2">
                    <div className="text-sm font-medium text-foreground leading-tight">{fund.name_zh || fund.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 md:hidden">{fund.trustee_name}</div>
                  </td>
                  <td className="px-3 py-2 hidden md:table-cell text-xs text-muted-foreground">{fund.trustee_name}</td>
                  <td className="px-3 py-2 hidden lg:table-cell">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{fund.category || '—'}</span>
                  </td>
                  <td className="px-3 py-2 text-right"><ReturnValue value={fund.return_ytd} /></td>
                  <td className="px-3 py-2 text-right hidden sm:table-cell"><ReturnValue value={fund.return_1y} /></td>
                  <td className="px-3 py-2 text-right hidden lg:table-cell"><ReturnValue value={fund.return_3y} /></td>
                  <td className="px-3 py-2 text-right hidden xl:table-cell text-xs text-muted-foreground">
                    {fund.fee_ratio != null ? `${fund.fee_ratio.toFixed(2)}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
