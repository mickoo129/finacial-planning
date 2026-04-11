import { useState, useMemo, useCallback } from 'react';
import { useMpfFunds, MpfFund } from '@/hooks/useMpfFunds';
import { ReturnValue } from '@/components/ReturnValue';
import { CascadingFundFilter } from '@/components/CascadingFundFilter';
import { RETURN_LABELS } from '@/lib/returnFields';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Plus, X, Calculator, TrendingUp, AlertTriangle, PieChart } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, PieChart as RPieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(217, 91%, 60%)', 'hsl(142, 71%, 45%)', 'hsl(45, 93%, 47%)', 'hsl(262, 83%, 58%)', 'hsl(24, 95%, 53%)'];

interface PortfolioFund {
  fund: MpfFund;
  weight: number;
}

export default function PortfolioSimulator() {
  const { data: funds, isLoading } = useMpfFunds();
  const [portfolio, setPortfolio] = useState<PortfolioFund[]>([]);
  const [fundId, setFundId] = useState('');
  const [initialAmount, setInitialAmount] = useState(100000);
  const [monthlyContribution, setMonthlyContribution] = useState(1500);
  const [years, setYears] = useState(10);
  const [filteredFunds, setFilteredFunds] = useState<MpfFund[]>([]);

  const handleFilterChange = useCallback((filtered: MpfFund[]) => {
    setFilteredFunds(filtered.filter(f => !portfolio.find(p => p.fund.etnet_fund_id === f.etnet_fund_id)));
  }, [portfolio]);

  const handleFundSelect = (id: string) => {
    setFundId(id);
  };

  const addFund = () => {
    if (!fundId || portfolio.length >= 5) return;
    const fund = funds?.find(f => f.id === fundId);
    if (fund) {
      const remainingWeight = 100 - portfolio.reduce((sum, p) => sum + p.weight, 0);
      setPortfolio([...portfolio, { fund, weight: Math.min(remainingWeight, 20) }]);
      setFundId('');
    }
  };

  const removeFund = (id: string) => {
    setPortfolio(portfolio.filter(p => p.fund.etnet_fund_id !== id));
  };

  const updateWeight = (id: string, weight: number) => {
    setPortfolio(portfolio.map(p =>
      p.fund.etnet_fund_id === id ? { ...p, weight } : p
    ));
  };

  const totalWeight = portfolio.reduce((sum, p) => sum + p.weight, 0);

  const metrics = useMemo(() => {
    if (portfolio.length === 0 || totalWeight === 0) return null;

    const weightedReturn1y = portfolio.reduce((sum, p) => sum + (p.fund.return_1y ?? 0) * (p.weight / totalWeight), 0);
    const weightedReturn3y = portfolio.reduce((sum, p) => sum + (p.fund.return_3y ?? 0) * (p.weight / totalWeight), 0);
    const weightedReturnYtd = portfolio.reduce((sum, p) => sum + (p.fund.return_ytd ?? 0) * (p.weight / totalWeight), 0);
    const weightedReturn3m = portfolio.reduce((sum, p) => sum + (p.fund.return_3m ?? 0) * (p.weight / totalWeight), 0);

    const annualReturn = weightedReturn1y / 100;
    const returns = [weightedReturnYtd, weightedReturn3m * 4, weightedReturn1y, weightedReturn3y / 3];
    const validReturns = returns.filter(r => r !== 0);
    const meanReturn = validReturns.reduce((s, r) => s + r, 0) / (validReturns.length || 1);
    const variance = validReturns.reduce((s, r) => s + Math.pow(r - meanReturn, 2), 0) / (validReturns.length || 1);
    const volatility = Math.sqrt(variance);
    const riskFreeRate = 4;
    const sharpeRatio = volatility > 0 ? (weightedReturn1y - riskFreeRate) / volatility : 0;
    const maxDrawdown = -volatility * 1.5;
    const var95 = -(weightedReturn1y - 1.645 * volatility);

    const monthlyRate = annualReturn / 12;
    const months = years * 12;
    let projectedValue = initialAmount;
    const projectionData = [{ month: 0, value: initialAmount, base: initialAmount }];
    
    for (let m = 1; m <= months; m++) {
      projectedValue = projectedValue * (1 + monthlyRate) + monthlyContribution;
      const baseValue = initialAmount + monthlyContribution * m;
      if (m % (months > 120 ? 12 : months > 36 ? 3 : 1) === 0 || m === months) {
        projectionData.push({ month: m, value: Math.round(projectedValue), base: Math.round(baseValue) });
      }
    }

    const totalContributed = initialAmount + monthlyContribution * months;
    const totalGain = projectedValue - totalContributed;

    return {
      weightedReturn1y, weightedReturn3y, weightedReturnYtd, weightedReturn3m,
      volatility: Math.round(volatility * 100) / 100,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      var95: Math.round(var95 * 100) / 100,
      projectedValue: Math.round(projectedValue),
      totalContributed: Math.round(totalContributed),
      totalGain: Math.round(totalGain),
      gainPercent: Math.round((totalGain / totalContributed) * 10000) / 100,
      projectionData,
    };
  }, [portfolio, totalWeight, initialAmount, monthlyContribution, years]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="text-muted-foreground text-sm">載入中...</div></div>;
  }

  if (!funds?.length) {
    return <div className="text-center py-20 text-muted-foreground text-sm">暫無數據，請先在排名頁面更新數據</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-foreground">投資組合模擬器</h1>
        <p className="text-xs text-muted-foreground mt-1">回測組合表現 · 計算風險指標 · 模擬未來增長</p>
      </div>

      {/* Fund selection with cascading filters */}
      <div className="bg-card rounded-lg border border-border p-4 space-y-4">
        <div className="text-sm font-medium text-foreground">選擇基金（最多 5 隻）</div>
        <CascadingFundFilter
          funds={funds}
          onFilteredFundsChange={handleFilterChange}
          showFundSelector
          selectedFundId={fundId}
          onFundSelect={handleFundSelect}
        />
        <Button onClick={addFund} disabled={!fundId || portfolio.length >= 5} className="w-full" size="sm">
          <Plus className="h-4 w-4 mr-2" /> 加入組合
        </Button>

        {portfolio.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">基金配置</span>
              <span className={totalWeight === 100 ? 'text-[hsl(var(--positive))] font-medium' : 'text-[hsl(var(--negative))] font-medium'}>
                總比重: {totalWeight}%
              </span>
            </div>
            {portfolio.map((p, i) => (
              <div key={p.fund.etnet_fund_id} className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i] }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">{p.fund.name_zh || p.fund.name}</div>
                  <Slider value={[p.weight]} max={100} step={5} onValueChange={([v]) => updateWeight(p.fund.etnet_fund_id, v)} className="mt-1" />
                </div>
                <span className="text-xs font-medium text-foreground w-10 text-right">{p.weight}%</span>
                <button onClick={() => removeFund(p.fund.etnet_fund_id)} className="text-muted-foreground hover:text-destructive">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Simulation params */}
      {portfolio.length > 0 && (
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="text-sm font-medium text-foreground mb-3">模擬參數</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">初始投入 (HK$)</label>
              <Input type="number" value={initialAmount} onChange={e => setInitialAmount(Number(e.target.value))} min={0} step={10000} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">每月供款 (HK$)</label>
              <Input type="number" value={monthlyContribution} onChange={e => setMonthlyContribution(Number(e.target.value))} min={0} step={500} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">投資年期</label>
              <div className="flex items-center gap-3">
                <Slider value={[years]} max={40} min={1} step={1} onValueChange={([v]) => setYears(v)} className="flex-1" />
                <span className="text-sm font-medium w-12 text-right">{years} 年</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {metrics && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: '組合年初至今', value: metrics.weightedReturnYtd },
              { label: '組合1年回報', value: metrics.weightedReturn1y },
              { label: '組合3年回報', value: metrics.weightedReturn3y },
              { label: '組合3個月', value: metrics.weightedReturn3m },
            ].map(item => (
              <div key={item.label} className="bg-card rounded-lg border border-border p-3">
                <div className="text-[10px] text-muted-foreground mb-1">{item.label}</div>
                <ReturnValue value={item.value} className="text-lg font-bold" />
              </div>
            ))}
          </div>

          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground text-sm">風險收益分析</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-[10px] text-muted-foreground mb-1">波幅（估算）</div>
                <div className="text-lg font-bold text-foreground">{metrics.volatility}%</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-[10px] text-muted-foreground mb-1">夏普比率</div>
                <div className={`text-lg font-bold ${metrics.sharpeRatio >= 1 ? 'text-[hsl(var(--positive))]' : metrics.sharpeRatio >= 0 ? 'text-foreground' : 'text-[hsl(var(--negative))]'}`}>
                  {metrics.sharpeRatio}
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-[10px] text-muted-foreground mb-1">最大回撤（估算）</div>
                <div className="text-lg font-bold text-[hsl(var(--negative))]">{metrics.maxDrawdown}%</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-[10px] text-muted-foreground mb-1">VaR 95%</div>
                <div className="text-lg font-bold text-[hsl(var(--negative))]">{metrics.var95 > 0 ? '-' : ''}{Math.abs(metrics.var95)}%</div>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-3">* 風險指標基於現有回報數據估算，僅供參考</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-foreground text-sm">資產配置</h3>
              </div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RPieChart>
                    <Pie data={portfolio.map(p => ({ name: p.fund.name_zh || p.fund.name, value: p.weight }))} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ value }) => `${value}%`} labelLine={false}>
                      {portfolio.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value}%`, '比重']} />
                  </RPieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1 mt-2">
                {portfolio.map((p, i) => (
                  <div key={p.fund.etnet_fund_id} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-foreground truncate flex-1">{p.fund.name_zh || p.fund.name}</span>
                    <span className="text-muted-foreground">{p.weight}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-foreground text-sm">投資增長預測</h3>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                <div className="bg-muted/50 rounded-lg p-2">
                  <div className="text-[10px] text-muted-foreground">總投入</div>
                  <div className="text-sm font-bold text-foreground">{(metrics.totalContributed / 10000).toFixed(1)}萬</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-2">
                  <div className="text-[10px] text-muted-foreground">預計價值</div>
                  <div className="text-sm font-bold text-[hsl(var(--positive))]">{(metrics.projectedValue / 10000).toFixed(1)}萬</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-2">
                  <div className="text-[10px] text-muted-foreground">預計回報</div>
                  <div className="text-sm font-bold text-[hsl(var(--positive))]">+{metrics.gainPercent}%</div>
                </div>
              </div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics.projectionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                    <XAxis dataKey="month" tickFormatter={m => m === 0 ? '現在' : `${Math.round(m / 12)}年`} fontSize={10} stroke="hsl(215, 16%, 47%)" />
                    <YAxis tickFormatter={v => `${(v / 10000).toFixed(0)}萬`} fontSize={10} stroke="hsl(215, 16%, 47%)" />
                    <Tooltip formatter={(value: number, name: string) => [`HK$ ${value.toLocaleString()}`, name === 'value' ? '預計價值' : '總投入']} labelFormatter={m => `第 ${Math.round(m / 12)} 年`} />
                    <Line type="monotone" dataKey="base" stroke="hsl(215, 16%, 47%)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                    <Line type="monotone" dataKey="value" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-foreground text-sm">組合基金明細</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">基金</th>
                    <th className="text-center px-2 py-2.5 font-medium text-muted-foreground text-xs">比重</th>
                    <th className="text-right px-2 py-2.5 font-medium text-muted-foreground text-xs">年初至今</th>
                    <th className="text-right px-2 py-2.5 font-medium text-muted-foreground text-xs">1年</th>
                    <th className="text-right px-2 py-2.5 font-medium text-muted-foreground text-xs">3年</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {portfolio.map(p => (
                    <tr key={p.fund.etnet_fund_id}>
                      <td className="px-3 py-2.5 text-xs text-foreground truncate max-w-[150px] sm:max-w-[250px]">{p.fund.name_zh || p.fund.name}</td>
                      <td className="px-2 py-2.5 text-center text-xs font-medium">{p.weight}%</td>
                      <td className="px-2 py-2.5 text-right"><ReturnValue value={p.fund.return_ytd} className="text-xs" /></td>
                      <td className="px-2 py-2.5 text-right"><ReturnValue value={p.fund.return_1y} className="text-xs" /></td>
                      <td className="px-2 py-2.5 text-right"><ReturnValue value={p.fund.return_3y} className="text-xs" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {portfolio.length === 0 && (
        <div className="bg-card rounded-lg border border-border p-8 sm:p-12 text-center">
          <Calculator className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">選擇基金並調整比重開始模擬</p>
          <p className="text-xs text-muted-foreground mt-1">透過類別、種類、受託人和計劃篩選後選擇基金</p>
        </div>
      )}
    </div>
  );
}
