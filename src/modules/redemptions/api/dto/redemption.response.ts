import { ApiProperty } from '@nestjs/swagger';

export class RedemptionResponseDto {
  @ApiProperty({ format: 'uuid', example: 'b3b2a1a0-9c8b-7d6e-5f4a-3b2c1d0a9f8e' })
  id!: string;

  @ApiProperty({ format: 'uuid', example: 'd1c01e35-515a-4b05-9f5b-9d41334c9c22' })
  couponId!: string;

  @ApiProperty({ format: 'uuid', example: 'f9b8c7d6-e5d4-c3b2-a1b0-c9d8e7f6a5b4' })
  campaignId!: string;

  @ApiProperty({ format: 'uuid', example: 'c7b6a5d4-e3f2-1a0b-9c8d-7e6f5a4b3c2d' })
  businessId!: string;

  @ApiProperty({ format: 'uuid', example: '1a2b3c4d-5e6f-7a8b-9c0d-e1f2a3b4c5d6' })
  branchId!: string;

  @ApiProperty({ format: 'uuid', example: '9f8e7d6c-5b4a-3b2c-1d0a-9f8e7d6c5b4a' })
  redeemedByMembershipId!: string;

  @ApiProperty({ example: '2026-07-11T16:30:00.000Z' })
  redeemedAt!: string;

  @ApiProperty({ enum: ['CONFIRMED', 'REVERSED'], example: 'CONFIRMED' })
  status!: string;

  @ApiProperty({ example: 1000.00, nullable: true })
  originalAmount!: number | null;

  @ApiProperty({ example: 150.00, nullable: true })
  discountAmount!: number | null;

  @ApiProperty({ example: 850.00, nullable: true })
  finalAmount!: number | null;

  @ApiProperty({ example: 'SYP' })
  currencyCode!: string;

  @ApiProperty({ example: 'My Awesome Store', nullable: true })
  businessName?: string;

  @ApiProperty({ example: '50% Off Selected Items', nullable: true })
  offerTitle?: string;
}

export class RedemptionPageMetaDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 45 })
  total!: number;
}

export class RedemptionPageResponseDto {
  @ApiProperty({ type: [RedemptionResponseDto] })
  items!: RedemptionResponseDto[];

  @ApiProperty({ type: RedemptionPageMetaDto })
  meta!: RedemptionPageMetaDto;
}
