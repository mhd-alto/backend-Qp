import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNumber, IsObject, IsOptional, IsPositive, IsString } from 'class-validator';

export class RecommendCampaignRequestDto {
  @ApiProperty({ enum: ['attract_new', 'increase_weekday', 'clear_inventory', 'promote_new', 'bring_back'] })
  @IsEnum(['attract_new', 'increase_weekday', 'clear_inventory', 'promote_new', 'bring_back'])
  goal!: 'attract_new' | 'increase_weekday' | 'clear_inventory' | 'promote_new' | 'bring_back';

  @ApiProperty({ example: 'restaurant' })
  @IsString()
  businessCategory!: string;

  @ApiProperty({ example: 35000 })
  @IsNumber()
  @IsPositive()
  avgBillValue!: number;

  @ApiProperty({ example: 0.4, description: 'Margin percentage (e.g. 0.4 for 40%)' })
  @IsNumber()
  @IsPositive()
  approxMargin!: number;

  @ApiProperty({ example: ['Monday', 'Tuesday'] })
  @IsArray()
  @IsString({ each: true })
  slowDays!: string[];

  @ApiProperty({ example: 100 })
  @IsNumber()
  @IsPositive()
  targetCustomerCount!: number;

  @ApiProperty({ example: 14 })
  @IsNumber()
  @IsPositive()
  campaignDurationDays!: number;
}

export class GenerateContentRequestDto {
  @ApiProperty()
  @IsObject()
  recommendation!: any;

  @ApiProperty({ example: 'restaurant' })
  @IsString()
  businessCategory!: string;

  @ApiProperty({ example: 'attract_new' })
  @IsString()
  goal!: string;
}

export class CreateFromRecommendationRequestDto {
  @ApiProperty({ example: 20 })
  @IsNumber()
  @IsPositive()
  discountPercent!: number;

  @ApiProperty({ example: 400 })
  @IsNumber()
  @IsPositive()
  couponQuota!: number;

  @ApiProperty({ example: 'Perfect Dinner Discount' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 'Perfect Dinner Discount English', required: false })
  @IsString()
  @IsOptional()
  titleEn?: string;

  @ApiProperty({ example: 'Get 20% off your bill' })
  @IsString()
  description!: string;

  @ApiProperty({ example: 'Get 20% off your bill English', required: false })
  @IsString()
  @IsOptional()
  descriptionEn?: string;

  @ApiProperty({ example: 'Terms of use here' })
  @IsString()
  termsText!: string;

  @ApiProperty({ example: 'Terms of use here English', required: false })
  @IsString()
  @IsOptional()
  termsTextEn?: string;

  @ApiProperty({ example: 'c7b6a5d4-e3f2-1a0b-9c8d-7e6f5a4b3c2d', description: 'Primary Category UUID' })
  @IsString()
  primaryCategoryId!: string;

  @ApiProperty({ example: '1a2b3c4d-5e6f-7a8b-9c0d-e1f2a3b4c5d6', description: 'Branch UUID' })
  @IsString()
  branchId!: string;

  @ApiProperty({ example: 'dinner-discount-slug' })
  @IsString()
  publicSlug!: string;
}
