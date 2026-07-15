import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ValidateCouponRequestDto {
  @ApiProperty({ required: false, format: 'uuid', nullable: true, example: '70d9a8c7-b6e5-4a3d-2c1b-0a9b8c7d6e5f' })
  @IsUUID()
  @IsOptional()
  qrToken?: string | null;

  @ApiProperty({ required: false, nullable: true, example: 'SHAM-FRIDAY-50' })
  @IsString()
  @IsOptional()
  code?: string | null;
}
