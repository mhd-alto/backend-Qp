import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
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

export class CreateCategoryRequestDto {
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @ApiProperty({ maxLength: 100, example: 'مطاعم' })
  @IsString()
  @Length(1, 100)
  nameAr!: string;

  @ApiPropertyOptional({ maxLength: 100, nullable: true, example: 'Restaurants' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  nameEn?: string | null;

  @ApiProperty({ maxLength: 120, example: 'restaurants' })
  @Transform(({ value }) => normalizeSlug(value))
  @IsString()
  @Length(1, 120)
  slug!: string;

  @ApiPropertyOptional({ nullable: true, example: 'https://example.com/icon.svg' })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  iconUrl?: string | null;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
