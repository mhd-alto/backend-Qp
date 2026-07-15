import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class ListPublicOffersQueryDto {
  @ApiPropertyOptional({
    maxLength: 120,
    example: 'pizza',
    description: 'Free-text search across business name, campaign title, and description.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  q?: string;

  @ApiPropertyOptional({
    description: 'Active category slug returned by GET /public/categories.',
    example: 'restaurants',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  category?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 50, example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 20;
}

export class GetPublicOfferSlugParamDto {
  @ApiProperty({
    example: 'damascus-pizza-july-offer',
    description: 'Stable public campaign slug taken from the public offers list.',
  })
  @IsString()
  @MaxLength(200)
  slug!: string;
}

export class GetPublicOfferQueryDto {
  @ApiPropertyOptional({
    maxLength: 64,
    example: 'fb_damascus_july_2026',
    description:
      'Optional tracking token from a campaign source link. Usually comes from the public URL query string.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  src?: string;
}
