/**
 * Convert cumulative return to annualized return.
 * Formula: ((1 + cumulative/100)^(1/years) - 1) * 100
 */
export function toAnnualized(cumulative: number, years: number): number {
  if (years <= 0) return cumulative;
  const factor = 1 + cumulative / 100;
  if (factor <= 0) return -100; // edge case: total loss
  return (Math.pow(factor, 1 / years) - 1) * 100;
}

/** Map of return fields to their period in years (only for multi-year fields) */
export const RETURN_FIELD_YEARS: Record<string, number> = {
  return_3y: 3,
  return_5y: 5,
  return_10y: 10,
};
