import { useState, useMemo, useCallback } from 'react';
import { ReturnValue } from '@/components/ReturnValue';
import { useMpfFunds, MpfFund } from '@/hooks/useMpfFunds';
import { CascadingFundFilter } from '@/components/CascadingFundFilter';
import { ReturnField, RETURN_LABELS, RETURN_FIELDS } from '@/lib/returnFields';
import { Input } from '@/components/ui/input';
import { Search, ArrowUpDown, RefreshCw, Database } from 'lucide-react';

const DEFAULT_VISIBLE: ReturnField[] = ['return_ytd', 'return_1y', 'return_3y'];

export default function SearchFunds() {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<ReturnField>('return_1y');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [visibleColumns, setVisibleColumns] = useState<Set<ReturnField>>(new Set(DEFAULT_VISIBLE));
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

  const toggleSort = (field: ReturnField) => {
    if (sortBy === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(field); setSortDir('desc'); }
  };

  const toggleColumn = (field: ReturnField) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  };

  const visibleFields = useMemo(() => RETURN_FIELDS.filter(f => visibleColumns.has(f)), [visibleColumns]);

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
      <div className="glass-card rounded-3xl p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜尋基金名稱..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 h-9 text-sm rounded-2xl"
          />
        </div>
        <CascadingFundFilter funds={funds} onFilteredFundsChange={handleFilterChange} />
        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block">顯示時間段（點擊開關）</label>
          <div className="flex flex-wrap gap-1 bg-muted/30 rounded-2xl p-1">
            {RETURN_FIELDS.map(key => {
              const isVisible = visibleColumns.has(key);
              const isActive = sortBy === key;
              return (
                <button
                  key={key}
                  onClick={() => toggleColumn(key)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all ${
                    isVisible
                      ? isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-primary/15 text-primary border border-primary/20'
                      : 'text-muted-foreground/50 hover:text-muted-foreground'
                  }`}
                >
                  {RETURN_LABELS[key]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results table */}
      <div className="glass-card rounded-3xl shadow-[0_8px_30px_-12px_hsl(230_60%_70%/0.15)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full banking-table min-w-[500px]">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="text-left px-5 py-2 text-muted-foreground w-8">#</th>
                <th className="text-left px-5 py-2 text-muted-foreground">基金名稱</th>
                <th className="text-left px-5 py-2 text-muted-foreground">受託人</th>
                <th className="text-left px-5 py-2 text-muted-foreground">類別</th>
                {visibleFields.map(field => (
                  <th
                    key={field}
                    className="text-right px-5 py-2 text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort(field)}
                  >
                    <span className={`inline-flex items-center gap-0.5 ${sortBy === field ? 'text-primary font-semibold' : ''}`}>
                      {RETURN_LABELS[field]} <ArrowUpDown className="h-2.5 w-2.5" />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredFunds.map((fund, i) => (
                <tr key={fund.id || fund.etnet_fund_id}>
                  <td className="px-5 py-2.5 text-[10px] text-muted-foreground">{i + 1}</td>
                  <td className="px-5 py-2.5">
                    <div className="text-sm font-medium text-foreground leading-tight max-w-[220px] truncate">{fund.name_zh || fund.name}</div>
                  </td>
                  <td className="px-5 py-2.5 text-xs text-muted-foreground">{fund.trustee_name}</td>
                  <td className="px-5 py-2.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground">{fund.sub_category || fund.category || '未分類'}</span>
                  </td>
                  {visibleFields.map(field => (
                    <td key={field} className="px-5 py-2.5 text-right"><ReturnValue value={fund[field]} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
