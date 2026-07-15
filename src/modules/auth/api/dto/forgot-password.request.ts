import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class ForgotPasswordRequestDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsString()
  @Length(1, 120)
  identifier!: string;
}
