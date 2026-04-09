import { useState } from 'react';
import { Calculator, TrendingUp, Banknote, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function RetirementCalc() {
  const [age, setAge] = useState(30);
  const [retireAge, setRetireAge] = useState(65);
  const [monthlyContrib, setMonthlyContrib] = useState(3000);
  const [currentBalance, setCurrentBalance] = useState(100000);
  const [annualReturn, setAnnualReturn] = useState(5);
  const [showResult, setShowResult] = useState(false);

  const years = retireAge - age;
  const monthlyRate = annualReturn / 100 / 12;
  const months = years * 12;

  // Future value of existing balance
  const fvBalance = currentBalance * Math.pow(1 + monthlyRate, months);
  // Future value of monthly contributions (annuity)
  const fvContrib = monthlyContrib * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  const totalAmount = fvBalance + fvContrib;
  const totalContributed = currentBalance + monthlyContrib * months;
  const totalGains = totalAmount - totalContributed;

  const formatCurrency = (n: number) => {
    if (n >= 10000000) return `${(n / 10000000).toFixed(1)} 千萬`;
    if (n >= 10000) return `${(n / 10000).toFixed(0)} 萬`;
    return n.toLocaleString();
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">退休計算器</h1>
        <p className="text-sm text-muted-foreground mt-1">估算你的強積金退休儲蓄</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">現時年齡</label>
            <Input
              type="number"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              min={18} max={64}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">預計退休年齡</label>
            <Input
              type="number"
              value={retireAge}
              onChange={(e) => setRetireAge(Number(e.target.value))}
              min={age + 1} max={75}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">每月供款 (HK$)</label>
          <Input
            type="number"
            value={monthlyContrib}
            onChange={(e) => setMonthlyContrib(Number(e.target.value))}
            min={0}
          />
          <p className="text-xs text-muted-foreground mt-1">僱主 + 僱員每月總供款</p>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">現有強積金結餘 (HK$)</label>
          <Input
            type="number"
            value={currentBalance}
            onChange={(e) => setCurrentBalance(Number(e.target.value))}
            min={0}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">預期年均回報率 (%)</label>
          <Select value={String(annualReturn)} onValueChange={(v) => setAnnualReturn(Number(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2, 3, 4, 5, 6, 7, 8, 10].map(r => (
                <SelectItem key={r} value={String(r)}>{r}%</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">過去10年強積金平均年回報約 4-6%</p>
        </div>

        <Button onClick={() => setShowResult(true)} className="w-full" size="lg">
          <Calculator className="h-4 w-4 mr-2" /> 計算退休儲蓄
        </Button>
      </div>

      {showResult && years > 0 && (
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h3 className="font-semibold text-foreground text-lg">預計退休時強積金結餘</h3>

          <div className="text-center py-4">
            <div className="text-4xl font-bold text-primary">
              HK$ {totalAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              約 {formatCurrency(totalAmount)} 港元
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <Calendar className="h-5 w-5 text-primary mx-auto mb-1" />
              <div className="text-xs text-muted-foreground">供款年期</div>
              <div className="font-semibold text-foreground mt-0.5">{years} 年</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <Banknote className="h-5 w-5 text-primary mx-auto mb-1" />
              <div className="text-xs text-muted-foreground">總供款</div>
              <div className="font-semibold text-foreground mt-0.5">
                {formatCurrency(totalContributed)}
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <TrendingUp className="h-5 w-5 text-[hsl(var(--positive))] mx-auto mb-1" />
              <div className="text-xs text-muted-foreground">投資回報</div>
              <div className="font-semibold text-[hsl(var(--positive))] mt-0.5">
                {formatCurrency(totalGains)}
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            * 以上計算僅供參考，實際回報視乎市場表現而定。不計通脹因素。
          </p>
        </div>
      )}
    </div>
  );
}
