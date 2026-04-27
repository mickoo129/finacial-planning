import { ReturnField, RETURN_LABELS } from '@/lib/returnFields';
import { sourceForField, type DataSource } from '@/lib/fundSource';
import { Database } from 'lucide-react';

const SOURCE_RULE: Record<DataSource, string> = {
  ETNET: '短線：年初至今 / 1個月 / 3個月 / 1年 / 3年',
  MPFA: '年度回報 2021–2025 ／ 長線 5年 / 10年',
  OTHER: '其他',
};

const SOURCE_NOTE: Partial<Record<DataSource, string>> = {
  ETNET: 'MPFA 平台不提供 3 年數據',
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
  const note = SOURCE_NOTE[source];
  return (
    <div
      className={`inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-1.5 rounded-full border text-[11px] leading-tight ${SOURCE_STYLE[source]} ${className}`}
      title={`「${RETURN_LABELS[field]}」使用 ${source} 數據源｜${SOURCE_RULE[source]}${note ? `（${note}）` : ''}`}
    >
      <span className="inline-flex items-center gap-1.5 font-semibold">
        <Database className="h-3 w-3" />
        數據源 {source}
      </span>
      <span className="opacity-30">|</span>
      <span className="opacity-90">{SOURCE_RULE[source]}</span>
      {note && (
        <>
          <span className="opacity-30">|</span>
          <span className="opacity-70">※ {note}</span>
        </>
      )}
    </div>
  );
}

