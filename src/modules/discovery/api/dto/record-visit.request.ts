import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, Length, Matches } from 'class-validator';

const ENTRY_POINTS = ['DIRECT', 'COUPONHUB_SEARCH', 'TRACKING_LINK'] as const;

export class RecordVisitRequestDto {
  @ApiPropertyOptional({
    nullable: true,
    maxLength: 64,
    example: 'fb_damascus_july_2026',
    description:
      'Optional source tracking token from the opened public link. Use null when the visit did not start from a tracked link.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 64)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  trackingToken?: string | null;

  @ApiPropertyOptional({
    enum: ENTRY_POINTS,
    default: 'DIRECT',
    example: 'TRACKING_LINK',
    description:
      'How the visitor reached the offer page: direct open, internal CouponHub search, or tracked external link.',
  })
  @IsOptional()
  @IsString()
  @IsIn(ENTRY_POINTS)
  entryPoint: (typeof ENTRY_POINTS)[number] = 'DIRECT';

  @ApiPropertyOptional({
    nullable: true,
    pattern: '^[0-9A-Fa-f]{64}$',
    example:
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    description:
      'Optional short-lived opaque visitor hash from the frontend. Do not send raw IP or any personal data.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9A-Fa-f]{64}$/)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  visitorHash?: string | null;
}
