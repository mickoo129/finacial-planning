import { TimePeriod, TIME_PERIOD_LABELS } from '@/types/mpf';
import { cn } from '@/lib/utils';

interface TimePeriodSelectorProps {
  selected: TimePeriod;
  onChange: (period: TimePeriod) => void;
}

const periods: TimePeriod[] = ['1y', '5y', '10y', 'ytd', '2025', '2024', '2023', '2022', '2021'];

export function TimePeriodSelector({ selected, onChange }: TimePeriodSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {periods.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium transition-all',
            selected === p
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-card text-muted-foreground hover:text-foreground border border-border hover:border-primary/30'
          )}
        >
          {TIME_PERIOD_LABELS[p]}
        </button>
      ))}
    </div>
  );
}
