import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, Length } from 'class-validator';

const ENTRY_POINTS = ['DIRECT', 'COUPONHUB_SEARCH', 'TRACKING_LINK'] as const;

export class ClaimCouponRequestDto {
  @ApiPropertyOptional({
    nullable: true,
    maxLength: 64,
    example: 'fb_damascus_july_2026',
    description:
      'Optional tracking token carried from the offer page URL or from the recorded visit context.',
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
      'Customer claim entry point. Use TRACKING_LINK when claiming from a tracked offer link, COUPONHUB_SEARCH after internal search, or DIRECT otherwise.',
  })
  @IsOptional()
  @IsString()
  @IsIn(ENTRY_POINTS)
  entryPoint: (typeof ENTRY_POINTS)[number] = 'DIRECT';
}
