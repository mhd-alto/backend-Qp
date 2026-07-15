import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { normalizeEmail } from '../../../../common/utilities/normalize-email';
import { normalizePhone } from '../../../../common/utilities/normalize-phone';
import { AtLeastOneField } from '../../../../common/validators/at-least-one-field.validator';
import { IsNormalizedPhone } from '../../../../common/validators/normalized-phone.validator';

export class RegisterRequestDto {
  @ApiProperty({ minLength: 2, maxLength: 120, example: 'Laila Abou Hatab' })
  @IsString()
  @Length(2, 120)
  fullName!: string;

  @ApiPropertyOptional({ example: 'user@example.com', nullable: true })
  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => normalizeEmail(value))
  email?: string | null;

  @ApiPropertyOptional({ example: '+963912345678', nullable: true })
  @IsOptional()
  @Transform(({ value }) => normalizePhone(value))
  @IsNormalizedPhone()
  phone?: string | null;

  @ApiProperty({ minLength: 8, maxLength: 128, example: 'StrongPass123' })
  @IsString()
  @Length(8, 128)
  password!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  @Equals(true)
  termsAccepted!: true;

  @ApiProperty({ example: true })
  @IsBoolean()
  @Equals(true)
  privacyAccepted!: true;

  @ApiPropertyOptional({ example: 'mvp-v0.2', default: 'mvp-v0.2' })
  @IsOptional()
  @IsString()
  @Length(1, 30)
  policyVersion?: string;

  @AtLeastOneField(['email', 'phone'], {
    message: 'At least one of email or phone is required',
  })
  private readonly atLeastOneIdentifier!: boolean;
}
