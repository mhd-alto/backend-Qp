import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class RefreshTokenRequestDto {
  @ApiProperty()
  @IsString()
  @Length(1, 2048)
  refreshToken!: string;
}
