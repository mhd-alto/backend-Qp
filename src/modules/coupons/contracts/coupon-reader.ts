import { CouponDetailsResponseDto, CouponSummaryResponseDto } from '../api/dto/coupon.response';
import { ListMyCouponsQueryDto } from '../api/dto/coupon.query';

export interface CouponReader {
  listForUser(
    userId: string,
    query: ListMyCouponsQueryDto,
  ): Promise<{ items: CouponSummaryResponseDto[]; total: number }>;
  findDetailsForUser(
    couponId: string,
    userId: string,
  ): Promise<CouponDetailsResponseDto | null>;
}
