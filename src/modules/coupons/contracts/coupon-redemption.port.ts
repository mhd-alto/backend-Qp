export interface CouponRedemptionPort {
  findCouponRedemptionSnapshot(couponId: string): Promise<{
    id: string;
    campaignId: string;
    userId: string;
    code: string;
    qrToken: string;
    status: string;
    expiresAt: Date;
  } | null>;
}
