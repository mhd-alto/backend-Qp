import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUUID, Length, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IsNormalizedPhone } from '../../../../common/validators/normalized-phone.validator';

export class UpdateBusinessBranchDto {
  @ApiPropertyOptional({ example: 'فرع أبو رمانة المحدث' })
  @IsOptional()
  @IsString()
  @Length(1, 150)
  name?: string;

  @ApiPropertyOptional({ nullable: true, example: 'Updated Abu Rummaneh Branch' })
  @IsOptional()
  @IsString()
  @Length(1, 150)
  nameEn?: string | null;

  @ApiPropertyOptional({ example: 'abu-rummaneh-branch-demo-2-updated' })
  @IsOptional()
  @IsString()
  @Length(1, 150)
  slug?: string;

  @ApiPropertyOptional({ example: 'أبو رمانة، شارع الجلاء، قرب ساحة الروضة، دمشق' })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  addressLine?: string;

  @ApiPropertyOptional({ nullable: true, example: 'Abu Rummaneh, Al Jalaa Street, near Rawda Square, Damascus' })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  addressLineEn?: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true, example: 'a0766cce-148d-43b1-96a6-75fb99915b1f' })
  @IsOptional()
  @IsUUID()
  locationId?: string | null;

  @ApiPropertyOptional({ nullable: true, example: '+963944880202' })
  @IsOptional()
  @Type(() => String)
  @IsNormalizedPhone()
  phone?: string | null;
}

export class UpdateBusinessRequestDto {
  @ApiPropertyOptional({ nullable: true, example: 'بيت الشام للمشاوي ذ.م.م' })
  @IsOptional()
  @IsString()
  @Length(1, 180)
  legalName?: string | null;

  @ApiPropertyOptional({ example: 'بيت الشام للمشاوي - فرع دمشق' })
  @IsOptional()
  @IsString()
  @Length(1, 180)
  displayName?: string;

  @ApiPropertyOptional({ nullable: true, example: 'Beit Al Sham Grills - Damascus' })
  @IsOptional()
  @IsString()
  @Length(1, 180)
  displayNameEn?: string | null;

  @ApiPropertyOptional({ example: 'beit-al-sham-grills-demo-2-updated' })
  @IsOptional()
  @IsString()
  @Length(1, 180)
  slug?: string;

  @ApiPropertyOptional({ nullable: true, example: 'تم تحديث وصف النشاط التجاري ليتضمن عروض الغداء اليومية.' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'Business profile updated to include daily lunch offers.' })
  @IsOptional()
  @IsString()
  descriptionEn?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example:
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=400&q=80',
  })
  @IsOptional()
  @IsString()
  logoUrl?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
  })
  @IsOptional()
  @IsString()
  coverUrl?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'contact@beitalsham-demo.sy' })
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional({ example: '+963944880201' })
  @IsOptional()
  @IsNormalizedPhone()
  phone?: string;

  @ApiPropertyOptional({ format: 'uuid', example: 'c7fec39c-37f8-4770-ac9c-08f97b8ebbda' })
  @IsOptional()
  @IsUUID()
  primaryCategoryId?: string;

  @ApiPropertyOptional({ type: UpdateBusinessBranchDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateBusinessBranchDto)
  branch?: UpdateBusinessBranchDto;
}
