import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class ResetPasswordRequestDto {
  @ApiProperty()
  @IsString()
  @Length(1, 2048)
  token!: string;

  @ApiProperty({ example: 'NewStrongPass123' })
  @IsString()
  @Length(8, 128)
  newPassword!: string;
}
