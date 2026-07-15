import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Length } from 'class-validator';

export class CreateCampaignSourceRequestDto {
  @ApiProperty({
    enum: ['FACEBOOK', 'INSTAGRAM', 'WHATSAPP', 'INFLUENCER', 'PAID_AD', 'OTHER'],
    example: 'INSTAGRAM',
  })
  @IsString()
  @IsIn(['FACEBOOK', 'INSTAGRAM', 'WHATSAPP', 'INFLUENCER', 'PAID_AD', 'OTHER'])
  sourceType!: string;

  @ApiProperty({ maxLength: 150, example: 'انستغرام المطعم' })
  @IsString()
  @Length(1, 150)
  label!: string;

  @ApiPropertyOptional({ nullable: true, maxLength: 150, example: 'Restaurant Instagram' })
  @IsOptional()
  @IsString()
  @Length(1, 150)
  labelEn?: string | null;
}

export class SourceStatusRequestDto {
  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE'], example: 'ACTIVE' })
  @IsString()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status!: 'ACTIVE' | 'INACTIVE';
}
