import { useState, useMemo } from 'react';
import { ReturnValue } from '@/components/ReturnValue';
import { TimePeriod, TIME_PERIOD_LABELS } from '@/types/mpf';
import { getAllFunds, getCategories, getSubCategories, TRUSTEES } from '@/data/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, X, GitCompare } from 'lucide-react';
import { Fund } from '@/types/mpf';

export default function CompareFunds() {
  const [selectedFunds, setSelectedFunds] = useState<Fund[]>([]);
  const [category, setCategory] = useState('all');
  const [subCategory, setSubCategory] = useState('all');
  const [trustee, setTrustee] = useState('all');
  const [fundId, setFundId] = useState('');

  const allFunds = useMemo(() => getAllFunds(), []);
  const categories = useMemo(() => getCategories(), []);
  const subCategories = useMemo(() => getSubCategories(), []);

  const filteredFunds = useMemo(() => {
    let funds = allFunds;
    if (category !== 'all') funds = funds.filter(f => f.category === category);
    if (subCategory !== 'all') funds = funds.filter(f => f.subCategory === subCategory);
    if (trustee !== 'all') funds = funds.filter(f => f.trustee === trustee);
    return funds.filter(f => !selectedFunds.find(sf => sf.id === f.id));
  }, [allFunds, category, subCategory, trustee, selectedFunds]);

  const addFund = () => {
    if (!fundId || selectedFunds.length >= 4) return;
    const fund = allFunds.find(f => f.id === fundId);
    if (fund) {
      setSelectedFunds([...selectedFunds, fund]);
      setFundId('');
    }
  };

  const removeFund = (id: string) => {
    setSelectedFunds(selectedFunds.filter(f => f.id !== id));
  };

  const periods: TimePeriod[] = ['ytd', '3m', '1y', '3y', '5y', '10y'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">比較基金</h1>
        <p className="text-sm text-muted-foreground mt-1">最多比較 4 隻基金 · 按積金局 4 維分類選擇</p>
      </div>

      {/* Selection panel */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <div className="text-sm font-medium text-muted-foreground">選擇基金（最多 4 隻）</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">⑤ 基金</label>
          <div className="flex gap-2">
            <Select value={fundId} onValueChange={setFundId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={`選擇基金 (${filteredFunds.length} 隻)`} />
              </SelectTrigger>
              <SelectContent>
                {filteredFunds.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          onClick={addFund}
          disabled={!fundId || selectedFunds.length >= 4}
          className="w-full"
          size="lg"
        >
          <Plus className="h-4 w-4 mr-2" /> 加入比較
        </Button>
      </div>

      {/* Comparison table */}
      {selectedFunds.length > 0 ? (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground min-w-[120px]">項目</th>
                  {selectedFunds.map(f => (
                    <th key={f.id} className="text-center px-4 py-3 font-medium min-w-[150px]">
                      <div className="flex items-center justify-between">
                        <div className="text-left flex-1">
                          <div className="text-foreground text-xs">{f.name}</div>
                          <div className="text-[10px] text-muted-foreground">{f.trustee}</div>
                        </div>
                        <button onClick={() => removeFund(f.id)} className="text-muted-foreground hover:text-destructive ml-2">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-4 py-2.5 text-muted-foreground">類型</td>
                  {selectedFunds.map(f => (
                    <td key={f.id} className="px-4 py-2.5 text-center text-xs">{f.subCategory || f.category}</td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-muted-foreground">風險</td>
                  {selectedFunds.map(f => (
                    <td key={f.id} className="px-4 py-2.5 text-center">{f.riskLevel}/7</td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-muted-foreground">管理費 (FER)</td>
                  {selectedFunds.map(f => (
                    <td key={f.id} className="px-4 py-2.5 text-center">{f.managementFee}%</td>
                  ))}
                </tr>
                {periods.map(p => (
                  <tr key={p}>
                    <td className="px-4 py-2.5 text-muted-foreground">{TIME_PERIOD_LABELS[p]}</td>
                    {selectedFunds.map(f => (
                      <td key={f.id} className="px-4 py-2.5 text-center">
                        <ReturnValue value={f.returns[p]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <GitCompare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">按上方步驟選擇基金開始比較</p>
          <p className="text-xs text-muted-foreground mt-1">① 基金類別 → ② 基金種類 → ③ 受託人 → ④ 計劃 → ⑤ 基金</p>
        </div>
      )}
    </div>
  );
}
