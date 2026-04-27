// 雙源策略：根據 etnet_fund_id prefix 判斷來源
// - ETNSI* = ETNET（短線：YTD/1M/3M/1Y + 年度回報強項）
// - MPFA_* = MPFA（長線：3Y/5Y/10Y + 完整分類強項）

import type { ReturnField } from './returnFields';

export type DataSource = 'ETNET' | 'MPFA' | 'OTHER';

export function detectSource(etnet_fund_id: string | null | undefined): DataSource {
  if (!etnet_fund_id) return 'OTHER';
  if (etnet_fund_id.startsWith('MPFA_')) return 'MPFA';
  if (etnet_fund_id.startsWith('ETNSI')) return 'ETNET';
  return 'OTHER';
}

// 每個回報欄位最佳來源
export function sourceForField(field: ReturnField): DataSource {
  switch (field) {
    // 短線 + 年度 → ETNET
    case 'return_ytd':
    case 'return_1m':
    case 'return_3m':
    case 'return_1y':
    case 'return_2025':
    case 'return_2024':
    case 'return_2023':
    case 'return_2022':
    case 'return_2021':
      return 'ETNET';
    // 長線 → MPFA
    case 'return_3y':
    case 'return_5y':
    case 'return_10y':
      return 'MPFA';
    default:
      return 'ETNET';
  }
}

// 根據時段過濾基金集（每個基金已有 dataSource 屬性）
export function filterFundsBySource<T extends { dataSource: DataSource }>(
  funds: T[],
  field: ReturnField,
): T[] {
  const target = sourceForField(field);
  return funds.filter((f) => f.dataSource === target);
}
