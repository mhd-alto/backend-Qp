import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  parentId!: string | null;

  @ApiProperty({ example: 'مطاعم' })
  nameAr!: string;

  @ApiPropertyOptional({ example: 'Restaurants', nullable: true })
  nameEn!: string | null;

  @ApiProperty({ example: 'restaurants' })
  slug!: string;

  @ApiPropertyOptional({ example: 'https://example.com/icon.svg', nullable: true })
  iconUrl!: string | null;

  @ApiProperty({ example: 0 })
  sortOrder!: number;

  @ApiProperty({ example: 'ACTIVE' })
  status!: string;
}
