import { EffectiveCouponStatus } from '../enums/coupon-status.enum';

export class CouponIssuePolicy {
  static resolveEffectiveStatus(input: {
    status: string;
    expiresAt: Date;
    now?: Date;
  }): EffectiveCouponStatus {
    const now = input.now ?? new Date();

    if (input.status === 'AVAILABLE' && input.expiresAt.getTime() < now.getTime()) {
      return 'EXPIRED';
    }

    if (input.status === 'REDEEMED') {
      return 'REDEEMED';
    }

    if (input.status === 'EXPIRED') {
      return 'EXPIRED';
    }

    if (input.status === 'CANCELLED') {
      return 'CANCELLED';
    }

    if (input.status === 'SUSPENDED') {
      return 'SUSPENDED';
    }

    return 'AVAILABLE';
  }

  static isClaimableWindow(startAt: Date, endAt: Date, now = new Date()): boolean {
    return startAt.getTime() <= now.getTime() && endAt.getTime() >= now.getTime();
  }
}
