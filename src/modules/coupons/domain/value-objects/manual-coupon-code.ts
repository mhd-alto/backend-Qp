import { normalizeCouponCode } from '../../../../common/utilities/normalize-coupon-code';

export class ManualCouponCode {
  static normalize(value: string): string {
    return normalizeCouponCode(value);
  }
}
