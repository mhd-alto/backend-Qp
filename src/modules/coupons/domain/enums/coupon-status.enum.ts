export const COUPON_STATUSES = [
  'AVAILABLE',
  'REDEEMED',
  'EXPIRED',
  'CANCELLED',
  'SUSPENDED',
] as const;

export type CouponStatus = (typeof COUPON_STATUSES)[number];

export const EFFECTIVE_COUPON_STATUSES = [
  'AVAILABLE',
  'REDEEMED',
  'EXPIRED',
  'CANCELLED',
  'SUSPENDED',
] as const;

export type EffectiveCouponStatus =
  (typeof EFFECTIVE_COUPON_STATUSES)[number];
