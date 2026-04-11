import { useState, useMemo } from 'react';
import { useMpfFunds, MpfFund } from '@/hooks/useMpfFunds';
import { ReturnValue } from '@/components/ReturnValue';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, X, GitCompare } from 'lucide-react';

const CHART_COLORS = ['hsl(217, 91%, 60%)', 'hsl(142, 71%, 45%)', 'hsl(24, 95%, 53%)', 'hsl(262, 83%, 58%)'];

type ReturnField = 'return_ytd' | 'return_1m' | 'return_3m' | 'return_1y' | 'return_3y' | 'return_5y' | 'return_10y' | 'return_2024' | 'return_2023' | 'return_2022' | 'return_2021';

const RETURN_LABELS: Record<ReturnField, string> = {
  return_ytd: '年初至今',
  return_1m: '1個月',
  return_3m: '3個月',
  return_1y: '1年',
  return_3y: '3年',
  return_5y: '5年',
  return_10y: '10年',
  return_2024: '2024年',
  return_2023: '2023年',
  return_2022: '2022年',
  return_2021: '2021年',
};

export default function CompareFunds() {
  const { data: funds, isLoading } = useMpfFunds();
  const [selectedFunds, setSelectedFunds] = useState<MpfFund[]>([]);
  const [category, setCategory] = useState('all');
  const [trustee, setTrustee] = useState('all');
  const [fundId, setFundId] = useState('');

  const categories = useMemo(() => {
    if (!funds) return [];
    return [...new Set(funds.map(f => f.sub_category || f.category).filter(Boolean))].sort() as string[];
  }, [funds]);

  const trustees = useMemo(() => {
    if (!funds) return [];
    return [...new Set(funds.map(f => f.trustee_name).filter(Boolean))].sort() as string[];
  }, [funds]);

  const filteredFunds = useMemo(() => {
    if (!funds) return [];
    let filtered = funds;
    if (category !== 'all') filtered = filtered.filter(f => (f.sub_category || f.category) === category);
    if (trustee !== 'all') filtered = filtered.filter(f => f.trustee_name === trustee);
    return filtered.filter(f => !selectedFunds.find(sf => sf.id === f.id));
  }, [funds, category, trustee, selectedFunds]);

  const addFund = () => {
    if (!fundId || selectedFunds.length >= 4) return;
    const fund = funds?.find(f => f.id === fundId);
    if (fund) {
      setSelectedFunds([...selectedFunds, fund]);
      setFundId('');
    }
  };

  const removeFund = (id: string) => {
    setSelectedFunds(selectedFunds.filter(f => f.id !== id));
  };

  const returnFields: ReturnField[] = ['return_ytd', 'return_3m', 'return_1y', 'return_3y', 'return_5y', 'return_10y', 'return_2024', 'return_2023', 'return_2022', 'return_2021'];

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">載入中...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">比較基金</h1>
        <p className="text-sm text-muted-foreground mt-1">最多比較 4 隻基金 · {funds?.length || 0} 隻基金可選</p>
      </div>

      {/* Selection panel */}
      <div className="bg-card rounded-xl border border-border p-4 sm:p-5 space-y-4">
        <div className="text-sm font-medium text-muted-foreground">選擇基金（最多 4 隻）</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">基金類別</label>
            <Select value={category} onValueChange={v => { setCategory(v); setFundId(''); }}>
              <SelectTrigger><SelectValue placeholder="全部類別" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部類別</SelectItem>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">受託人</label>
            <Select value={trustee} onValueChange={v => { setTrustee(v); setFundId(''); }}>
              <SelectTrigger><SelectValue placeholder="全部受託人" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部受託人</SelectItem>
                {trustees.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">選擇基金</label>
          <div className="flex gap-2">
            <Select value={fundId} onValueChange={setFundId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={`選擇基金 (${filteredFunds.length} 隻)`} />
              </SelectTrigger>
              <SelectContent>
                {filteredFunds.map(f => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                    <span className="text-muted-foreground ml-1 text-xs">({f.trustee_name})</span>
                  </SelectItem>
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

      {/* Selected fund chips */}
      {selectedFunds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedFunds.map((f, i) => (
            <div
              key={f.id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border"
              style={{ borderColor: CHART_COLORS[i], color: CHART_COLORS[i] }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />
              <span className="max-w-[120px] sm:max-w-[200px] truncate">{f.name}</span>
              <button onClick={() => removeFund(f.id)} className="hover:opacity-70">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedFunds.length > 0 ? (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-3 sm:px-4 py-3 font-medium text-muted-foreground min-w-[80px]">項目</th>
                  {selectedFunds.map((f, i) => (
                    <th key={f.id} className="text-center px-2 sm:px-4 py-3 font-medium min-w-[110px]">
                      <div className="flex items-center justify-between">
                        <div className="text-left flex-1 min-w-0">
                          <div className="text-foreground text-xs truncate">{f.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{f.trustee_name} · {f.scheme_name}</div>
                        </div>
                        <button onClick={() => removeFund(f.id)} className="text-muted-foreground hover:text-destructive ml-1 flex-shrink-0">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-3 sm:px-4 py-2.5 text-muted-foreground text-xs">類別</td>
                  {selectedFunds.map(f => (
                    <td key={f.id} className="px-2 sm:px-4 py-2.5 text-center text-xs">{f.sub_category || f.category || '-'}</td>
                  ))}
                </tr>
                <tr>
                  <td className="px-3 sm:px-4 py-2.5 text-muted-foreground text-xs">風險級別</td>
                  {selectedFunds.map(f => (
                    <td key={f.id} className="px-2 sm:px-4 py-2.5 text-center text-xs">{f.risk_level || '-'}</td>
                  ))}
                </tr>
                <tr>
                  <td className="px-3 sm:px-4 py-2.5 text-muted-foreground text-xs">FER 收費比率</td>
                  {selectedFunds.map(f => (
                    <td key={f.id} className="px-2 sm:px-4 py-2.5 text-center text-xs">
                      {f.fee_ratio != null ? `${f.fee_ratio.toFixed(2)}%` : '-'}
                    </td>
                  ))}
                </tr>
                {returnFields.map(field => (
                  <tr key={field}>
                    <td className="px-3 sm:px-4 py-2.5 text-muted-foreground text-xs">{RETURN_LABELS[field]}</td>
                    {selectedFunds.map(f => (
                      <td key={f.id} className="px-2 sm:px-4 py-2.5 text-center">
                        <ReturnValue value={f[field]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-8 sm:p-12 text-center">
          <GitCompare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">選擇基金開始比較</p>
          <p className="text-xs text-muted-foreground mt-1">篩選類別和受託人後，選擇想比較的基金</p>
        </div>
      )}
    </div>
  );
}
