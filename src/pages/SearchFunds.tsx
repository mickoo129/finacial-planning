import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TimePeriodSelector } from '@/components/TimePeriodSelector';
import { ReturnValue } from '@/components/ReturnValue';
import { TimePeriod } from '@/types/mpf';
import { searchFunds, getCategories, getSubCategories, TRUSTEES, getAllFunds } from '@/data/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, ArrowUpDown } from 'lucide-react';

export default function SearchFunds() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [subCategory, setSubCategory] = useState('all');
  const [trustee, setTrustee] = useState('all');
  const [period, setPeriod] = useState<TimePeriod>('1y');
  const [sortBy, setSortBy] = useState<'return' | 'fee' | 'risk'>('return');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const categories = useMemo(() => getCategories(), []);
  const subCategories = useMemo(() => getSubCategories(), []);
  const totalFunds = useMemo(() => getAllFunds().length, []);

  const filteredFunds = useMemo(() => {
    let funds = searchFunds(query, {
      category: category !== 'all' ? category : undefined,
      subCategory: subCategory !== 'all' ? subCategory : undefined,
      trustee: trustee !== 'all' ? trustee : undefined,
    });
    funds.sort((a, b) => {
      let diff = 0;
      if (sortBy === 'return') diff = b.returns[period] - a.returns[period];
      else if (sortBy === 'fee') diff = a.managementFee - b.managementFee;
      else diff = a.riskLevel - b.riskLevel;
      return sortDir === 'desc' ? diff : -diff;
    });
    return funds;
  }, [query, category, subCategory, trustee, period, sortBy, sortDir]);

  const selectedPeriods: TimePeriod[] = ['1y', '5y', '10y'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">基金一覽</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {filteredFunds.length} / {totalFunds} 隻基金 · 按積金局分類
        </p>
      </div>

      {/* Search and filters */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜尋基金名稱..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">① 基金類別</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="全部類別" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部類別</SelectItem>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">② 基金種類</label>
            <Select value={subCategory} onValueChange={setSubCategory}>
              <SelectTrigger><SelectValue placeholder="先選基金類別" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部種類</SelectItem>
                {subCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">③ 受託人</label>
            <Select value={trustee} onValueChange={setTrustee}>
              <SelectTrigger><SelectValue placeholder="全部受託人" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部受託人</SelectItem>
                {TRUSTEES.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">④ 計劃</label>
            <Select value="all" disabled>
              <SelectTrigger><SelectValue placeholder="先選受託人" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部計劃</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-2">選擇時間段（可多選，點擊欄標題排序）</div>
          <TimePeriodSelector selected={period} onChange={setPeriod} />
        </div>
      </div>

      {/* Results table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-8">#</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">基金名稱</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">種類</th>
                <th
                  className="text-right px-4 py-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => { setSortBy('return'); setSortDir(d => d === 'desc' ? 'asc' : 'desc'); }}
                >
                  <span className="inline-flex items-center gap-1">
                    1年 <ArrowUpDown className="h-3 w-3" />
                  </span>
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">5年</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">10年</th>
                <th
                  className="text-center px-4 py-3 font-medium text-muted-foreground hidden md:table-cell cursor-pointer hover:text-foreground"
                  onClick={() => { setSortBy('risk'); setSortDir(d => d === 'desc' ? 'asc' : 'desc'); }}
                >
                  風險
                </th>
                <th
                  className="text-right px-4 py-3 font-medium text-muted-foreground hidden md:table-cell cursor-pointer hover:text-foreground"
                  onClick={() => { setSortBy('fee'); setSortDir(d => d === 'desc' ? 'asc' : 'desc'); }}
                >
                  FER
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredFunds.map((fund, i) => (
                <tr key={fund.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground text-xs">{i + 1}</td>
                  <td className="px-4 py-3">
                    <Link to={`/fund/${fund.id}`} className="hover:text-primary transition-colors">
                      <div className="font-medium text-foreground">{fund.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {fund.trustee} · {fund.trusteePlan || fund.trustee + '強積金'}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {fund.subCategory || fund.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ReturnValue value={fund.returns['1y']} />
                  </td>
                  <td className="px-4 py-3 text-right hidden lg:table-cell">
                    <ReturnValue value={fund.returns['5y']} />
                  </td>
                  <td className="px-4 py-3 text-right hidden lg:table-cell">
                    <ReturnValue value={fund.returns['10y']} />
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell text-muted-foreground">{fund.riskLevel}</td>
                  <td className="px-4 py-3 text-right hidden md:table-cell text-muted-foreground">{fund.managementFee}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
