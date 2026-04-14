import { cn } from '@/lib/utils';
import { toAnnualized } from '@/lib/annualize';

interface ReturnValueProps {
  value: number | null | undefined;
  className?: string;
  /** Optional fallback label shown when data comes from a different period */
  fallbackLabel?: string;
  /** When set, display annualized return as primary and cumulative in parentheses */
  years?: number;
}

export function ReturnValue({ value, className, fallbackLabel, years }: ReturnValueProps) {
  if (value == null) {
    return <span className={cn('font-mono text-muted-foreground text-xs', className)}>—</span>;
  }

  const showAnnualized = years && years > 1;
  const annualized = showAnnualized ? toAnnualized(value, years) : null;
  const displayValue = annualized ?? value;

  const isPositive = displayValue > 0;
  const isNegative = displayValue < 0;

  return (
    <span className={cn(
      'inline-flex items-center font-mono font-semibold tabular-nums text-xs px-2 py-0.5 rounded-full',
      isPositive && 'text-positive bg-[hsl(var(--positive-bg))]',
      isNegative && 'text-negative bg-[hsl(var(--negative-bg))]',
      !isPositive && !isNegative && 'text-muted-foreground bg-muted',
      className
    )}>
      {displayValue > 0 ? '+' : ''}{displayValue.toFixed(2)}%
      {showAnnualized && (
        <span className="ml-1 text-[9px] font-normal opacity-70">
          ({value > 0 ? '+' : ''}{value.toFixed(1)}%累)
        </span>
      )}
      {fallbackLabel && (
        <span className="ml-1 text-[9px] font-normal opacity-70">({fallbackLabel})</span>
      )}
    </span>
  );
}
