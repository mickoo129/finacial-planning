import { cn } from '@/lib/utils';

interface ReturnValueProps {
  value: number | null | undefined;
  className?: string;
  /** Optional fallback label shown when data comes from a different period */
  fallbackLabel?: string;
}

export function ReturnValue({ value, className, fallbackLabel }: ReturnValueProps) {
  if (value == null) {
    return <span className={cn('font-mono text-muted-foreground text-xs', className)}>—</span>;
  }
  const isPositive = value > 0;
  const isNegative = value < 0;
  return (
    <span className={cn(
      'inline-flex items-center font-mono font-semibold tabular-nums text-xs px-2 py-0.5 rounded-full',
      isPositive && 'text-positive bg-[hsl(var(--positive-bg))]',
      isNegative && 'text-negative bg-[hsl(var(--negative-bg))]',
      !isPositive && !isNegative && 'text-muted-foreground bg-muted',
      className
    )}>
      {value > 0 ? '+' : ''}{value.toFixed(2)}%
      {fallbackLabel && (
        <span className="ml-1 text-[9px] font-normal opacity-70">({fallbackLabel})</span>
      )}
    </span>
  );
}
