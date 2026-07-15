import { CouponStatus } from '../enums/coupon-status.enum';

export type Coupon = {
  id: string;
  campaignId: string;
  userId: string;
  sourceId: string;
  code: string;
  qrToken: string;
  status: CouponStatus;
  issuedAt: Date;
  expiresAt: Date;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};
