import { ApiProperty } from '@nestjs/swagger';

export class CouponSummaryResponseDto {
  @ApiProperty({ format: 'uuid', example: 'd1c01e35-515a-4b05-9f5b-9d41334c9c22' })
  id!: string;

  @ApiProperty({ format: 'uuid', example: 'f9b8c7d6-e5d4-c3b2-a1b0-c9d8e7f6a5b4' })
  campaignId!: string;

  @ApiProperty({ example: 'SHAM-FRIDAY-50' })
  code!: string;

  @ApiProperty({ example: 'AVAILABLE' })
  status!: string;

  @ApiProperty({ example: 'AVAILABLE' })
  effectiveStatus!: string;

  @ApiProperty({ example: '2026-07-11T15:20:00.000Z' })
  issuedAt!: string;

  @ApiProperty({ example: '2026-08-11T23:59:59.000Z' })
  expiresAt!: string;

  @ApiProperty({ example: 'عرض غداء الجمعة العائلية' })
  offerTitle!: string;

  @ApiProperty({ example: 'بيت الشام للمشاوي' })
  businessName!: string;
}

export class BenefitDto {
  @ApiProperty({ enum: ['PERCENTAGE', 'FIXED_AMOUNT'], example: 'PERCENTAGE' })
  benefitType!: string;

  @ApiProperty({ nullable: true, example: 20.0 })
  percentageValue!: number | null;

  @ApiProperty({ nullable: true, example: null })
  fixedAmount!: number | null;

  @ApiProperty({ nullable: true, example: 'SYP' })
  currency!: string | null;

  @ApiProperty({ nullable: true, example: 50000 })
  maxDiscountAmount!: number | null;

  @ApiProperty({ nullable: true, example: 'خصم 20% على منيو الغداء العائلي لغاية 50,000 ل.س' })
  description!: string | null;

  @ApiProperty({ nullable: true, example: '20% discount on family lunch menu up to 50,000 SYP' })
  descriptionEn!: string | null;
}

export class ValidationResultResponseDto {
  @ApiProperty({ enum: ['VALID', 'INVALID'], example: 'VALID' })
  result!: 'VALID' | 'INVALID';

  @ApiProperty({
    enum: [
      'NOT_FOUND',
      'WRONG_BUSINESS',
      'ALREADY_REDEEMED',
      'EXPIRED',
      'CANCELLED',
      'SUSPENDED',
      'CAMPAIGN_INACTIVE',
      'BRANCH_NOT_ALLOWED',
      'NOT_ELIGIBLE',
      'LIMIT_REACHED',
    ],
    nullable: true,
    example: null,
  })
  failureReason!: string | null;

  @ApiProperty({ type: CouponSummaryResponseDto, nullable: true })
  coupon!: CouponSummaryResponseDto | null;

  @ApiProperty({ type: BenefitDto, nullable: true })
  benefit!: BenefitDto | null;

  @ApiProperty({ nullable: true, example: null })
  previouslyRedeemedAt!: string | null;
}
