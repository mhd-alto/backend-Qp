import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  BranchSummaryResponseDto,
  OrganizationCategoryResponseDto,
  BusinessSummaryResponseDto,
} from '../../../organizations/api/dto/business.dto';

export class CampaignBenefitResponseDto {
  @ApiProperty({ enum: ['PERCENTAGE', 'FIXED_AMOUNT'] })
  type!: string;

  @ApiPropertyOptional({ nullable: true })
  percentageValue!: number | null;

  @ApiPropertyOptional({ nullable: true })
  fixedAmount!: number | null;

  @ApiPropertyOptional({ nullable: true })
  currency!: string | null;

  @ApiPropertyOptional({ nullable: true })
  maxDiscountAmount!: number | null;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ nullable: true })
  descriptionEn!: string | null;
}

export class CampaignSourceResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  sourceType!: string;

  @ApiProperty()
  label!: string;

  @ApiPropertyOptional({ nullable: true })
  labelEn!: string | null;

  @ApiProperty()
  trackingToken!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  isSystemGenerated!: boolean;

  @ApiProperty()
  trackingUrl!: string;
}

export class CampaignSummaryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  titleEn!: string | null;

  @ApiProperty()
  publicSlug!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ format: 'date-time' })
  startAt!: string;

  @ApiProperty({ format: 'date-time' })
  endAt!: string;

  @ApiProperty({ type: CampaignBenefitResponseDto })
  benefit!: CampaignBenefitResponseDto;

  @ApiProperty()
  totalClaimLimit!: number;

  @ApiPropertyOptional({ nullable: true })
  rejectionReason!: string | null;

  @ApiPropertyOptional({ nullable: true })
  suspensionReason!: string | null;

  @ApiPropertyOptional({ type: BusinessSummaryResponseDto, nullable: true })
  business?: BusinessSummaryResponseDto | null;
}

export class CampaignDetailsResponseDto extends CampaignSummaryResponseDto {
  @ApiProperty()
  description!: string;

  @ApiPropertyOptional({ nullable: true })
  descriptionEn!: string | null;

  @ApiProperty()
  termsText!: string;

  @ApiPropertyOptional({ nullable: true })
  termsTextEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  imageUrl!: string | null;

  @ApiProperty({ type: OrganizationCategoryResponseDto })
  category!: OrganizationCategoryResponseDto;

  @ApiProperty({ type: BranchSummaryResponseDto })
  primaryBranch!: BranchSummaryResponseDto;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  submittedAt!: string | null;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  reviewedAt!: string | null;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  publishedAt!: string | null;

  @ApiProperty({ type: CampaignSourceResponseDto, isArray: true })
  sources!: CampaignSourceResponseDto[];
}

export class CampaignPageMetaDto {
  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  pageCount!: number;
}

export class CampaignPageResponseDto {
  @ApiProperty({ type: CampaignSummaryResponseDto, isArray: true })
  items!: CampaignSummaryResponseDto[];

  @ApiProperty({ type: CampaignPageMetaDto })
  meta!: CampaignPageMetaDto;
}
