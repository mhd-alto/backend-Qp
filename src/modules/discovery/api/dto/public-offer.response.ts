import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryResponseDto } from '../../../reference-data/api/dto/category.response';

export class OfferBenefitResponseDto {
  @ApiProperty({ enum: ['PERCENTAGE', 'FIXED_AMOUNT'] })
  type!: string;

  @ApiPropertyOptional({ nullable: true })
  percentageValue!: number | null;

  @ApiPropertyOptional({ nullable: true })
  fixedAmount!: number | null;

  @ApiProperty()
  currency!: string;

  @ApiPropertyOptional({ nullable: true })
  maxDiscountAmount!: number | null;
}

export class PublicBranchSummaryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  nameEn!: string | null;

  @ApiProperty()
  addressLine!: string;

  @ApiPropertyOptional({ nullable: true })
  addressLineEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  phone!: string | null;
}

export class PublicBusinessSummaryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  displayName!: string;

  @ApiPropertyOptional({ nullable: true })
  displayNameEn!: string | null;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional({ nullable: true })
  logoUrl!: string | null;

  @ApiProperty()
  phone!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ type: PublicBranchSummaryResponseDto })
  primaryBranch!: PublicBranchSummaryResponseDto;
}

export class OfferCardResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  titleEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  imageUrl!: string | null;

  @ApiProperty({ type: PublicBusinessSummaryResponseDto })
  business!: PublicBusinessSummaryResponseDto;

  @ApiProperty({ type: OfferBenefitResponseDto })
  benefit!: OfferBenefitResponseDto;

  @ApiProperty({ format: 'date-time' })
  endAt!: string;

  @ApiProperty({
    enum: ['AVAILABLE', 'NOT_STARTED', 'EXPIRED', 'SUSPENDED', 'SOLD_OUT', 'UNAVAILABLE'],
  })
  availability!: string;
}

export class OfferPageMetaResponseDto {
  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  pageCount!: number;
}

export class OfferPageResponseDto {
  @ApiProperty({ type: OfferCardResponseDto, isArray: true })
  items!: OfferCardResponseDto[];

  @ApiProperty({ type: OfferPageMetaResponseDto })
  meta!: OfferPageMetaResponseDto;
}

export class OfferDetailsResponseDto extends OfferCardResponseDto {
  @ApiProperty()
  description!: string;

  @ApiPropertyOptional({ nullable: true })
  descriptionEn!: string | null;

  @ApiProperty()
  termsText!: string;

  @ApiPropertyOptional({ nullable: true })
  termsTextEn!: string | null;

  @ApiProperty({ format: 'date-time' })
  startAt!: string;

  @ApiProperty({ minimum: 0 })
  remainingQuota!: number;

  @ApiProperty({ type: CategoryResponseDto })
  category!: CategoryResponseDto;
}

export class RecordVisitResponseDto {
  @ApiProperty({ format: 'uuid' })
  sourceId!: string;

  @ApiProperty({
    enum: [
      'DIRECT',
      'COUPONHUB_SEARCH',
      'FACEBOOK',
      'INSTAGRAM',
      'WHATSAPP',
      'INFLUENCER',
      'PAID_AD',
      'OTHER',
    ],
  })
  sourceType!: string;

  @ApiProperty()
  trackingToken!: string;
}
