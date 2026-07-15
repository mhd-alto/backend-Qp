export function normalizeCouponCode(value: string): string {
  return value.replace(/[\s\-_,/\\|;.:]+/g, '').trim().toUpperCase();
}
