import { useState, useMemo, useEffect } from 'react';
import { MpfFund } from '@/hooks/useMpfFunds';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function getMainCategory(fund: MpfFund): string {
  const sub = fund.sub_category || '';
  const cat = fund.category || '';
  if (sub.startsWith('股票基金')) return '股票基金';
  if (sub.startsWith('混合資產基金')) return '混合資產基金';
  if (sub.startsWith('債券基金')) return '債券基金';
  if (sub.startsWith('保證基金')) return '保證基金';
  if (sub.startsWith('強積金保守')) return '強積金保守基金';
  if (sub.startsWith('貨幣市場')) return '貨幣市場基金';
  if (sub.startsWith('預設投資')) return '預設投資策略';
  if (cat.includes('股票')) return '股票基金';
  if (cat.includes('混合') || cat.includes('均衡') || cat.includes('保守') || cat.includes('進取')) return '混合資產基金';
  if (cat.includes('固定收益') || cat.includes('債券')) return '債券基金';
  if (cat.includes('保證')) return '保證基金';
  if (cat.includes('強積金保守')) return '強積金保守基金';
  if (cat.includes('貨幣')) return '貨幣市場基金';
  return '其他';
}

interface CascadingFundFilterProps {
  funds: MpfFund[];
  onFilteredFundsChange: (funds: MpfFund[]) => void;
  showFundSelector?: boolean;
  selectedFundId?: string;
  onFundSelect?: (fundId: string) => void;
}

export function CascadingFundFilter({ funds, onFilteredFundsChange, showFundSelector = false, selectedFundId, onFundSelect }: CascadingFundFilterProps) {
  const [mainCategory, setMainCategory] = useState('all');
  const [subCategory, setSubCategory] = useState('all');
  const [trustee, setTrustee] = useState('all');
  const [scheme, setScheme] = useState('all');

  const mainCategories = useMemo(() => [...new Set(funds.map(f => getMainCategory(f)))].sort(), [funds]);
  const filteredByMain = useMemo(() => mainCategory === 'all' ? funds : funds.filter(f => getMainCategory(f) === mainCategory), [funds, mainCategory]);
  const subCategories = useMemo(() => [...new Set(filteredByMain.map(f => f.sub_category || f.category).filter(Boolean))].sort() as string[], [filteredByMain]);
  const filteredBySub = useMemo(() => subCategory === 'all' ? filteredByMain : filteredByMain.filter(f => (f.sub_category || f.category) === subCategory), [filteredByMain, subCategory]);
  const trustees = useMemo(() => [...new Set(filteredBySub.map(f => f.trustee_name).filter(Boolean))].sort() as string[], [filteredBySub]);
  const filteredByTrustee = useMemo(() => trustee === 'all' ? filteredBySub : filteredBySub.filter(f => f.trustee_name === trustee), [filteredBySub, trustee]);
  const schemes = useMemo(() => [...new Set(filteredByTrustee.map(f => f.scheme_name).filter(Boolean))].sort() as string[], [filteredByTrustee]);
  const filteredByScheme = useMemo(() => scheme === 'all' ? filteredByTrustee : filteredByTrustee.filter(f => f.scheme_name === scheme), [filteredByTrustee, scheme]);

  useEffect(() => { onFilteredFundsChange(filteredByScheme); }, [filteredByScheme, onFilteredFundsChange]);

  const handleMainChange = (v: string) => { setMainCategory(v); setSubCategory('all'); setTrustee('all'); setScheme('all'); };
  const handleSubChange = (v: string) => { setSubCategory(v); setTrustee('all'); setScheme('all'); };
  const handleTrusteeChange = (v: string) => { setTrustee(v); setScheme('all'); };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block">基金類別</label>
          <Select value={mainCategory} onValueChange={handleMainChange}>
            <SelectTrigger className="h-8 text-xs rounded-2xl"><SelectValue placeholder="全部" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部類別</SelectItem>
              {mainCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block">基金種類</label>
          <Select value={subCategory} onValueChange={handleSubChange}>
            <SelectTrigger className="h-8 text-xs rounded-2xl"><SelectValue placeholder="全部" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部種類</SelectItem>
              {subCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block">受託人</label>
          <Select value={trustee} onValueChange={handleTrusteeChange}>
            <SelectTrigger className="h-8 text-xs rounded-2xl"><SelectValue placeholder="全部" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部受託人</SelectItem>
              {trustees.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block">計劃名稱</label>
          <Select value={scheme} onValueChange={setScheme}>
            <SelectTrigger className="h-8 text-xs rounded-2xl"><SelectValue placeholder="全部" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部計劃</SelectItem>
              {schemes.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      {showFundSelector && (
        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block">基金名稱</label>
          <Select value={selectedFundId || ''} onValueChange={onFundSelect}>
            <SelectTrigger className="h-8 text-xs rounded-2xl">
              <SelectValue placeholder={`選擇基金 (${filteredByScheme.length} 隻)`} />
            </SelectTrigger>
            <SelectContent>
              {filteredByScheme.map(f => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name_zh || f.name}
                  {f.trustee_name && <span className="text-muted-foreground ml-1">({f.trustee_name})</span>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

export { getMainCategory };
