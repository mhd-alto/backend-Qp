import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsNotEmpty } from 'class-validator';

export class UserStatusRequestDto {
  @ApiProperty({ enum: ['ACTIVE', 'SUSPENDED'] })
  @IsEnum(['ACTIVE', 'SUSPENDED'])
  status!: 'ACTIVE' | 'SUSPENDED';

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
