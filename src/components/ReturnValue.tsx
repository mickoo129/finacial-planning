import { cn } from '@/lib/utils';

export function ReturnValue({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn(
      'font-mono font-medium tabular-nums',
      value > 0 ? 'text-positive' : value < 0 ? 'text-negative' : 'text-muted-foreground',
      className
    )}>
      {value > 0 ? '+' : ''}{value.toFixed(2)}%
    </span>
  );
}
