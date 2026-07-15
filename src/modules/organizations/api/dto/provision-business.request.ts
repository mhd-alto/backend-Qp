import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateNested,
} from 'class-validator';
import { AtLeastOneField } from '../../../../common/validators/at-least-one-field.validator';
import { normalizeEmail } from '../../../../common/utilities/normalize-email';
import { normalizePhone } from '../../../../common/utilities/normalize-phone';
import { IsNormalizedPhone } from '../../../../common/validators/normalized-phone.validator';

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

export class ProvisionPersonDto {
  @ApiProperty({ example: 'سامر الخطيب' })
  @IsString()
  @Length(2, 120)
  fullName!: string;

  @ApiPropertyOptional({ nullable: true, example: 'samer.khateeb.demo@couponhub.sy' })
  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => normalizeEmail(value))
  email?: string | null;

  @ApiPropertyOptional({ nullable: true, example: '+963944880103' })
  @IsOptional()
  @Transform(({ value }) => normalizePhone(value))
  @IsNormalizedPhone()
  phone?: string | null;

  @ApiProperty({ minLength: 8, maxLength: 128, example: 'StrongPass123!' })
  @IsString()
  @Length(8, 128)
  password!: string;

  @AtLeastOneField(['email', 'phone'], {
    message: 'At least one of email or phone is required',
  })
  private readonly atLeastOneIdentifier!: boolean;
}

export class ProvisionBranchDto {
  @ApiProperty({ example: 'فرع أبو رمانة' })
  @IsString()
  @Length(1, 150)
  name!: string;

  @ApiPropertyOptional({ nullable: true, example: 'Abu Rummaneh Branch' })
  @IsOptional()
  @IsString()
  @Length(1, 150)
  nameEn?: string | null;

  @ApiProperty({ example: 'abu-rummaneh-branch-demo-2' })
  @Transform(({ value }) => normalizeSlug(value))
  @IsString()
  @Length(1, 150)
  slug!: string;

  @ApiProperty({ example: 'أبو رمانة، قرب ساحة الروضة، دمشق' })
  @IsString()
  @Length(1, 1000)
  addressLine!: string;

  @ApiPropertyOptional({ nullable: true, example: 'Abu Rummaneh, near Rawda Square, Damascus' })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  addressLineEn?: string | null;

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    example: 'a0766cce-148d-43b1-96a6-75fb99915b1f',
    description: 'Use an existing location ID, for example one of the seeded Damascus areas.',
  })
  @IsOptional()
  @IsUUID()
  locationId?: string | null;

  @ApiPropertyOptional({ nullable: true, example: '+963944880102' })
  @IsOptional()
  @Transform(({ value }) => normalizePhone(value))
  @IsNormalizedPhone()
  phone?: string | null;
}

export class ProvisionBusinessRequestDto {
  @ApiPropertyOptional({ nullable: true, example: 'بيت الشام للمشاوي ذ.م.م' })
  @IsOptional()
  @IsString()
  @Length(1, 180)
  legalName?: string | null;

  @ApiProperty({ example: 'بيت الشام للمشاوي' })
  @IsString()
  @Length(1, 180)
  displayName!: string;

  @ApiPropertyOptional({ nullable: true, example: 'Beit Al Sham Grills' })
  @IsOptional()
  @IsString()
  @Length(1, 180)
  displayNameEn?: string | null;

  @ApiProperty({ example: 'beit-al-sham-grills-demo-2' })
  @Transform(({ value }) => normalizeSlug(value))
  @IsString()
  @Length(1, 180)
  slug!: string;

  @ApiPropertyOptional({
    nullable: true,
    example: 'مطعم سوري يقدم مشاوي ومقبلات شرقية وعروض غداء عائلية في دمشق.',
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: 'Syrian restaurant serving grills, Levantine appetizers, and family lunch offers in Damascus.',
  })
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

  @ApiPropertyOptional({ nullable: true, example: 'info@beitalsham-demo.sy' })
  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => normalizeEmail(value))
  email?: string | null;

  @ApiProperty({ example: '+963944880101' })
  @Transform(({ value }) => normalizePhone(value))
  @IsNormalizedPhone()
  phone!: string;

  @ApiProperty({
    format: 'uuid',
    example: 'c7fec39c-37f8-4770-ac9c-08f97b8ebbda',
    description: 'Use an existing active category ID, for example the seeded grills category.',
  })
  @IsUUID()
  primaryCategoryId!: string;

  @ApiProperty({ type: ProvisionBranchDto })
  @ValidateNested()
  @Type(() => ProvisionBranchDto)
  branch!: ProvisionBranchDto;

  @ApiProperty({ type: ProvisionPersonDto })
  @ValidateNested()
  @Type(() => ProvisionPersonDto)
  manager!: ProvisionPersonDto;

  @ApiPropertyOptional({ type: ProvisionPersonDto, isArray: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProvisionPersonDto)
  staff?: ProvisionPersonDto[];
}
