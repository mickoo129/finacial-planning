import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';

const numInputProps = (value: number, setter: (v: number) => void, min?: number, max?: number, step?: number) => ({
  type: "text" as const,
  inputMode: "decimal" as const,
  value: String(value),
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.\-]/g, '');
    if (raw === '' || raw === '-') { setter(0); return; }
    const n = Number(raw);
    if (!isNaN(n)) setter(n);
  },
  onFocus: (e: React.FocusEvent<HTMLInputElement>) => e.target.select(),
  min, max, step,
  className: "rounded-xl",
});

export default function RetirementCalc() {
  const [age, setAge] = useState(35);
  const [currentBalance, setCurrentBalance] = useState(200000);
  const [monthlySalary, setMonthlySalary] = useState(30000);
  const [monthlyTVC, setMonthlyTVC] = useState(0);
  const [employerExtra, setEmployerExtra] = useState(0);
  const [annualReturn, setAnnualReturn] = useState(5);
  const [inflationRate, setInflationRate] = useState(2);
  const [monthlyExpense, setMonthlyExpense] = useState(15000);

  const retireAge = 65;

  const result = useMemo(() => {
    const years = retireAge - age;
    if (years <= 0) return null;

    const mandatoryMonthly = Math.min(monthlySalary * 0.05, 1500) * 2;
    const totalMonthlyContrib = mandatoryMonthly + monthlyTVC + employerExtra;

    const monthlyRate = annualReturn / 100 / 12;
    const months = years * 12;

    const fvBalance = currentBalance * Math.pow(1 + monthlyRate, months);
    const fvContrib = totalMonthlyContrib * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    const nominalTotal = fvBalance + fvContrib;

    const realTotal = nominalTotal / Math.pow(1 + inflationRate / 100, years);
    const sustainYears = monthlyExpense > 0 ? realTotal / (monthlyExpense * 12) : Infinity;

    return { nominalTotal, realTotal, sustainYears, years, totalMonthlyContrib };
  }, [age, currentBalance, monthlySalary, monthlyTVC, employerExtra, annualReturn, inflationRate, monthlyExpense]);

  const formatWan = (n: number) => {
    const wan = n / 10000;
    return wan.toFixed(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">退休計算機</h1>
        <p className="text-sm text-muted-foreground mt-1">估算你的強積金退休儲蓄</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input Form */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-6 bg-primary rounded-full" />
            <h2 className="font-semibold text-foreground text-lg">退休參數模型</h2>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">現時年齡</label>
              <Input {...numInputProps(age, setAge, 18, 64)} />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">MPF 現有結餘 (HKD)</label>
              <Input {...numInputProps(currentBalance, setCurrentBalance, 0)} />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">現時月薪 (HKD)</label>
              <Input {...numInputProps(monthlySalary, setMonthlySalary, 0)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">每月 TVC 供款 (HKD)</label>
                <Input {...numInputProps(monthlyTVC, setMonthlyTVC, 0)} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">公司額外供款 (HKD/月)</label>
                <Input {...numInputProps(employerExtra, setEmployerExtra, 0)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">預期年回報 (%)</label>
                <Input {...numInputProps(annualReturn, setAnnualReturn, 0, 20, 0.5)} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">預期通脹率 (%)</label>
                <Input {...numInputProps(inflationRate, setInflationRate, 0, 10, 0.5)} />
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">退休後每月預期開支 (以今日物價計 HKD)</label>
              <Input {...numInputProps(monthlyExpense, setMonthlyExpense, 0)} />
            </div>
          </div>
        </div>

        {/* Right: Results */}
        <div className="space-y-6">
          {result && (
            <>
              {/* Main result card */}
              <div className="bg-primary text-primary-foreground rounded-2xl p-6 space-y-6">
                <div>
                  <p className="text-sm font-medium mb-2 opacity-90">65歲時 MPF 總額 (名義價值)</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold tracking-tight">HK$ {formatWan(result.nominalTotal)}</span>
                    <span className="text-lg opacity-70">萬</span>
                  </div>
                </div>

                <div className="border-t border-primary-foreground/10 pt-4 grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs opacity-60 mb-1">折算實質購買力 (扣除通脹後)</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold">HK$ {formatWan(result.realTotal)}</span>
                      <span className="text-sm opacity-60">萬</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-2 h-2 rounded-full bg-primary-foreground/40" />
                      <p className="text-xs opacity-60">預計資金可支撐年數</p>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold">
                        {result.sustainYears === Infinity ? '∞' : result.sustainYears.toFixed(1)}
                      </span>
                      <span className="text-sm opacity-60">年</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Advisor insight */}
              <div className="glass-card rounded-2xl p-6 border-l-4 border-accent">
                <p className="font-semibold text-foreground mb-2">
                  <span className="mr-1">💡</span> 顧問洞察：
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  在假設年回報 {annualReturn}% 與通脹率 {inflationRate}% 的情況下，您在 65 歲時的強積金結餘將達到{' '}
                  <strong className="text-foreground">HK${formatWan(result.nominalTotal)}萬</strong>。受通脹影響，其真實購買力相當於今天的{' '}
                  <strong className="text-foreground">HK${formatWan(result.realTotal)}萬</strong>。
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                  若希望維持每月 HK${monthlyExpense.toLocaleString()} 的生活質素，這筆資金大約可維持{' '}
                  <strong className="text-foreground">{result.sustainYears === Infinity ? '無限' : result.sustainYears.toFixed(1)} 年</strong>。
                  {result.sustainYears < 20 && (
                    <>建議透過 TVC (可扣稅自願性供款) 或重整高增長投資組合，以拉長您的退休跑道。</>
                  )}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
