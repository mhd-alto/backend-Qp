import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

function normalizeSlug(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export class CampaignBenefitRequestDto {
  @ApiProperty({ enum: ['PERCENTAGE', 'FIXED_AMOUNT'], example: 'PERCENTAGE' })
  @IsString()
  @IsIn(['PERCENTAGE', 'FIXED_AMOUNT'])
  type!: 'PERCENTAGE' | 'FIXED_AMOUNT';

  @ApiPropertyOptional({ nullable: true, minimum: 0.01, maximum: 100, example: 20 })
  @IsOptional()
  @Type(() => Number)
  @Min(0.01)
  @Max(100)
  percentageValue?: number | null;

  @ApiPropertyOptional({ nullable: true, minimum: 0.01, example: null })
  @IsOptional()
  @Type(() => Number)
  @Min(0.01)
  fixedAmount?: number | null;

  @ApiPropertyOptional({ nullable: true, minLength: 3, maxLength: 3, example: 'SYP' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string | null;

  @ApiPropertyOptional({ nullable: true, minimum: 0.01, example: 50000 })
  @IsOptional()
  @Type(() => Number)
  @Min(0.01)
  maxDiscountAmount?: number | null;

  @ApiPropertyOptional({ nullable: true, example: 'خصم على الوجبات العائلية' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'Discount on family meals' })
  @IsOptional()
  @IsString()
  descriptionEn?: string | null;
}

export class CreateCampaignRequestDto {
  @ApiProperty({ maxLength: 180, example: 'عرض غداء الجمعة العائلية' })
  @IsString()
  @Length(1, 180)
  title!: string;

  @ApiPropertyOptional({ nullable: true, maxLength: 180, example: 'Family Friday Lunch Offer' })
  @IsOptional()
  @IsString()
  @Length(1, 180)
  titleEn?: string | null;

  @ApiProperty({ maxLength: 200, example: 'beit-al-sham-family-friday-new' })
  @Transform(({ value }) => normalizeSlug(value))
  @IsString()
  @Length(1, 200)
  publicSlug!: string;

  @ApiProperty({ example: 'خصم خاص على وجبات المشاوي العائلية مع مقبلات مجانية داخل الصالة.' })
  @IsString()
  description!: string;

  @ApiPropertyOptional({
    nullable: true,
    example:
      'Special discount on family grill platters with complimentary appetizers for dine-in guests.',
  })
  @IsOptional()
  @IsString()
  descriptionEn?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example:
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @ApiProperty({ example: 'يسري يوم الجمعة فقط. لا يجمع مع العروض الأخرى. العرض داخل الصالة فقط.' })
  @IsString()
  termsText!: string;

  @ApiPropertyOptional({
    nullable: true,
    example: 'Valid on Fridays only. Not combinable with other offers. Dine-in only.',
  })
  @IsOptional()
  @IsString()
  termsTextEn?: string | null;

  @ApiProperty({
    format: 'uuid',
    example: 'c7fec39c-37f8-4770-ac9c-08f97b8ebbda',
    description: 'Use an existing active category ID, for example the seeded grills category.',
  })
  @IsUUID()
  primaryCategoryId!: string;

  @ApiProperty({
    format: 'uuid',
    example: 'c93835ff-02f8-4002-8006-8996921cdda9',
    description: 'Use an existing branch ID that belongs to the authenticated owner business.',
  })
  @IsUUID()
  branchId!: string;

  @ApiProperty({ format: 'date-time', example: '2026-07-20T10:00:00.000Z' })
  @IsString()
  startAt!: string;

  @ApiProperty({ format: 'date-time', example: '2026-08-05T22:00:00.000Z' })
  @IsString()
  endAt!: string;

  @ApiProperty({ type: CampaignBenefitRequestDto })
  @ValidateNested()
  @Type(() => CampaignBenefitRequestDto)
  benefit!: CampaignBenefitRequestDto;

  @ApiProperty({ minimum: 1, example: 300 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  totalClaimLimit!: number;

  @ApiPropertyOptional({ default: true, example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isSearchable?: boolean = true;
}

export class UpdateCampaignRequestDto {
  @ApiPropertyOptional({ example: 'عرض غداء الجمعة المميز' })
  @IsOptional()
  @IsString()
  @Length(1, 180)
  title?: string;

  @ApiPropertyOptional({ nullable: true, example: 'Premium Friday Lunch Offer' })
  @IsOptional()
  @IsString()
  @Length(1, 180)
  titleEn?: string | null;

  @ApiPropertyOptional({ example: 'beit-al-sham-family-friday-updated' })
  @IsOptional()
  @Transform(({ value }) => normalizeSlug(value))
  @IsString()
  @Length(1, 200)
  publicSlug?: string;

  @ApiPropertyOptional({ example: 'تم توسيع العرض ليشمل صحن مقبلات إضافي.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ nullable: true, example: 'Updated offer now includes an extra appetizer plate.' })
  @IsOptional()
  @IsString()
  descriptionEn?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example:
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @ApiPropertyOptional({ example: 'تم تحديث الشروط لتشمل الحجز المسبق عبر الهاتف.' })
  @IsOptional()
  @IsString()
  termsText?: string;

  @ApiPropertyOptional({ nullable: true, example: 'Updated terms now require advance booking by phone.' })
  @IsOptional()
  @IsString()
  termsTextEn?: string | null;

  @ApiPropertyOptional({
    format: 'uuid',
    example: 'c7fec39c-37f8-4770-ac9c-08f97b8ebbda',
  })
  @IsOptional()
  @IsUUID()
  primaryCategoryId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    example: 'c93835ff-02f8-4002-8006-8996921cdda9',
  })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ format: 'date-time', example: '2026-07-22T10:00:00.000Z' })
  @IsOptional()
  @IsString()
  startAt?: string;

  @ApiPropertyOptional({ format: 'date-time', example: '2026-08-10T22:00:00.000Z' })
  @IsOptional()
  @IsString()
  endAt?: string;

  @ApiPropertyOptional({ type: CampaignBenefitRequestDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CampaignBenefitRequestDto)
  benefit?: CampaignBenefitRequestDto;

  @ApiPropertyOptional({ minimum: 1, example: 350 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  totalClaimLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isSearchable?: boolean;
}
