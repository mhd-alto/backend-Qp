import { ApiProperty } from '@nestjs/swagger';

export class CampaignAnalyticsResponseDto {
  @ApiProperty({ format: 'uuid' })
  campaignId!: string;

  @ApiProperty()
  totalVisits!: number;

  @ApiProperty()
  knownUniqueUsers!: number;

  @ApiProperty()
  anonymousUniqueVisitors!: number;

  @ApiProperty()
  issuedCoupons!: number;

  @ApiProperty()
  confirmedRedemptions!: number;

  @ApiProperty()
  remainingQuota!: number;

  @ApiProperty()
  claimRatePercent!: number;

  @ApiProperty()
  redemptionRatePercent!: number;
}

export class SourceAnalyticsResponseDto {
  @ApiProperty({ format: 'uuid' })
  sourceId!: string;

  @ApiProperty()
  sourceType!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  totalVisits!: number;

  @ApiProperty()
  issuedCoupons!: number;

  @ApiProperty()
  confirmedRedemptions!: number;

  @ApiProperty()
  claimRatePercent!: number;

  @ApiProperty()
  redemptionRatePercent!: number;
}
