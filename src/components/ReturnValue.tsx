import { cn } from '@/lib/utils';

export function ReturnValue({ value, className }: { value: number | null | undefined; className?: string }) {
  if (value == null) {
    return <span className={cn('font-mono text-muted-foreground text-xs', className)}>—</span>;
  }
  return (
    <span className={cn(
      'font-mono font-semibold tabular-nums text-sm',
      value > 0 ? 'text-positive' : value < 0 ? 'text-negative' : 'text-muted-foreground',
      className
    )}>
      {value > 0 ? '+' : ''}{value.toFixed(2)}%
    </span>
  );
}
