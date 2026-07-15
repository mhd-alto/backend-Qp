import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString, Length } from 'class-validator';

export class RedeemCouponRequestDto {
  @ApiProperty({ example: 1000.00, required: false })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  originalAmount?: number;

  @ApiProperty({ example: 'SYP', required: false })
  @IsString()
  @Length(3, 3)
  @IsOptional()
  currencyCode?: string;
}
