import { TimePeriod, TIME_PERIOD_LABELS } from '@/types/mpf';
import { cn } from '@/lib/utils';

interface TimePeriodSelectorProps {
  selected: TimePeriod;
  onChange: (period: TimePeriod) => void;
}

const periods: TimePeriod[] = ['daily', 'weekly', 'monthly', 'mtd', 'ytd', '3m', '6m', '1y', '3y', '5y', '10y'];

export function TimePeriodSelector({ selected, onChange }: TimePeriodSelectorProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {periods.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
            selected === p
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-accent'
          )}
        >
          {TIME_PERIOD_LABELS[p]}
        </button>
      ))}
    </div>
  );
}
