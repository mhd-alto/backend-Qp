export const COUPON_EXPIRY_CALCULATOR = Symbol('COUPON_EXPIRY_CALCULATOR');

export type CouponExpiryInput = {
  issuedAt: Date;
  campaignEndAt: Date;
  couponValidityType: string;
  couponValidityMinutes: number | null;
  couponAbsoluteExpiresAt: Date | null;
};

export interface CouponExpiryCalculator {
  calculate(input: CouponExpiryInput): Date;
}
