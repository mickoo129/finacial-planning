import { ReturnField, RETURN_LABELS } from '@/lib/returnFields';
import { sourceForField, type DataSource } from '@/lib/fundSource';
import { Database } from 'lucide-react';

const SOURCE_RULE: Record<DataSource, string> = {
  ETNET: '短線（年初至今 / 1個月 / 3個月 / 1年 / 3年）',
  MPFA: '年度回報（2021-2025）／長線（5年 / 10年）',
  OTHER: '其他',
};

const SOURCE_STYLE: Record<DataSource, string> = {
  ETNET: 'bg-primary/10 text-primary border-primary/20',
  MPFA: 'bg-positive/10 text-positive border-positive/20',
  OTHER: 'bg-muted text-muted-foreground border-border',
};

interface Props {
  field: ReturnField;
  className?: string;
}

export function DataSourceBadge({ field, className = '' }: Props) {
  const source = sourceForField(field);
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-medium ${SOURCE_STYLE[source]} ${className}`}
      title={`「${RETURN_LABELS[field]}」使用 ${source} 數據源｜${SOURCE_RULE[source]}`}
    >
      <Database className="h-2.5 w-2.5" />
      <span>數據源：{source}</span>
      <span className="opacity-60">·</span>
      <span className="opacity-80">{SOURCE_RULE[source]}</span>
    </div>
  );
}
