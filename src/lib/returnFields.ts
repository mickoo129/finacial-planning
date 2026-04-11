// Unified return field definitions used across the entire app
// NOTE: return_1m removed (no data available), return_2025 added

export type ReturnField =
  | 'return_ytd' | 'return_3m' | 'return_1y' | 'return_3y'
  | 'return_5y' | 'return_10y'
  | 'return_2025' | 'return_2024' | 'return_2023' | 'return_2022' | 'return_2021';

export const RETURN_LABELS: Record<ReturnField, string> = {
  return_ytd: '年初至今',
  return_3m: '3個月',
  return_1y: '1年',
  return_3y: '3年',
  return_5y: '5年',
  return_10y: '10年',
  return_2025: '2025年',
  return_2024: '2024年',
  return_2023: '2023年',
  return_2022: '2022年',
  return_2021: '2021年',
};

export const RETURN_FIELDS: ReturnField[] = [
  'return_ytd', 'return_3m', 'return_1y', 'return_3y',
  'return_5y', 'return_10y',
  'return_2025', 'return_2024', 'return_2023', 'return_2022', 'return_2021',
];
