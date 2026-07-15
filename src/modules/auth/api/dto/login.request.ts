import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';

export class LoginRequestDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Length(1, 120)
  identifier!: string;

  @ApiProperty({ example: 'StrongPass123' })
  @IsString()
  @Length(1, 128)
  password!: string;
}
