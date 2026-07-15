import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignSourceResponseDto } from '../../../campaigns/api/dto/campaign.response';
import {
  COUPON_STATUSES,
  EFFECTIVE_COUPON_STATUSES,
} from '../../domain/enums/coupon-status.enum';

export class CouponSummaryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  campaignId!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ enum: COUPON_STATUSES })
  status!: string;

  @ApiProperty({ enum: EFFECTIVE_COUPON_STATUSES })
  effectiveStatus!: string;

  @ApiProperty({ format: 'date-time' })
  issuedAt!: string;

  @ApiProperty({ format: 'date-time' })
  expiresAt!: string;

  @ApiProperty()
  offerTitle!: string;

  @ApiProperty()
  businessName!: string;
}

export class CouponDetailsResponseDto extends CouponSummaryResponseDto {
  @ApiProperty({ format: 'uuid' })
  qrToken!: string;

  @ApiProperty({ type: CampaignSourceResponseDto })
  source!: CampaignSourceResponseDto;

  @ApiProperty()
  termsText!: string;

  @ApiPropertyOptional({ nullable: true })
  businessLogoUrl!: string | null;
}

export class CouponPageMetaResponseDto {
  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  pageCount!: number;
}

export class CouponPageResponseDto {
  @ApiProperty({ type: CouponSummaryResponseDto, isArray: true })
  items!: CouponSummaryResponseDto[];

  @ApiProperty({ type: CouponPageMetaResponseDto })
  meta!: CouponPageMetaResponseDto;
}
