import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class SimulateCampaignRequestDto {
  @ApiProperty({ example: 20, description: 'Discount percentage (e.g. 20 for 20%)' })
  @IsNumber()
  @IsPositive()
  discountPercent!: number;

  @ApiProperty({ example: 500, description: 'Maximum quota of coupons' })
  @IsNumber()
  @IsPositive()
  couponQuota!: number;

  @ApiProperty({ example: 14, description: 'Campaign duration in days' })
  @IsNumber()
  @IsPositive()
  campaignDays!: number;

  @ApiProperty({ example: 'restaurant', required: false, description: 'Business category' })
  @IsString()
  @IsOptional()
  businessCategory?: string;

  @ApiProperty({ example: 0.15, required: false, description: 'Historical redemption rate (0.0 to 1.0)' })
  @IsNumber()
  @IsOptional()
  historicalAvgRedemptionRate?: number;
}
