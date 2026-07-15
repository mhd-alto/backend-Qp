import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { EFFECTIVE_COUPON_STATUSES } from '../../domain/enums/coupon-status.enum';

export class ListMyCouponsQueryDto {
  @ApiPropertyOptional({ enum: EFFECTIVE_COUPON_STATUSES })
  @IsOptional()
  @IsIn(EFFECTIVE_COUPON_STATUSES)
  status?: (typeof EFFECTIVE_COUPON_STATUSES)[number];

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 20;
}
