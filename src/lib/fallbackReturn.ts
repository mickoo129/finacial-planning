import { ReturnField, RETURN_FIELDS, RETURN_LABELS } from './returnFields';
import type { MpfFund } from '@/hooks/useMpfFunds';

/** Priority order for fallback: short-term first, then annual */
const FALLBACK_PRIORITY: ReturnField[] = [
  'return_ytd', 'return_1y', 'return_3m', 'return_3y',
  'return_5y', 'return_10y',
  'return_2025', 'return_2024', 'return_2023', 'return_2022', 'return_2021',
];

export interface FallbackResult {
  value: number;
  field: ReturnField;
  label: string;
  isFallback: boolean;
}

/**
 * Get the return value for a fund, falling back to the best available period
 * if the selected period has no data.
 */
export function getFallbackReturn(fund: MpfFund, selectedField: ReturnField): FallbackResult | null {
  const selectedValue = fund[selectedField];
  if (selectedValue != null) {
    return { value: selectedValue as number, field: selectedField, label: RETURN_LABELS[selectedField], isFallback: false };
  }

  for (const field of FALLBACK_PRIORITY) {
    if (field === selectedField) continue;
    const val = fund[field];
    if (val != null) {
      return { value: val as number, field, label: RETURN_LABELS[field], isFallback: true };
    }
  }

  return null;
}
