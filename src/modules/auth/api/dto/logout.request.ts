import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class LogoutRequestDto {
  @ApiProperty()
  @IsString()
  @Length(1, 2048)
  refreshToken!: string;
}
