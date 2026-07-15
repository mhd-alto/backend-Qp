export const COUPON_CODE_GENERATOR = Symbol('COUPON_CODE_GENERATOR');

export interface CouponCodeGenerator {
  generate(): string;
}
