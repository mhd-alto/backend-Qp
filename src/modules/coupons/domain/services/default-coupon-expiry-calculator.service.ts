import { Injectable } from '@nestjs/common';
import {
  CouponExpiryCalculator,
  CouponExpiryInput,
} from './coupon-expiry-calculator';

@Injectable()
export class DefaultCouponExpiryCalculatorService
  implements CouponExpiryCalculator
{
  calculate(input: CouponExpiryInput): Date {
    if (input.couponValidityType === 'FIXED_DURATION' && input.couponValidityMinutes) {
      const expiresAt = new Date(
        input.issuedAt.getTime() + input.couponValidityMinutes * 60_000,
      );
      return expiresAt.getTime() <= input.campaignEndAt.getTime()
        ? expiresAt
        : input.campaignEndAt;
    }

    if (
      input.couponValidityType === 'ABSOLUTE_DATE' &&
      input.couponAbsoluteExpiresAt
    ) {
      return input.couponAbsoluteExpiresAt.getTime() <= input.campaignEndAt.getTime()
        ? input.couponAbsoluteExpiresAt
        : input.campaignEndAt;
    }

    return input.campaignEndAt;
  }
}
