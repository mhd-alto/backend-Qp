import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, Length } from 'class-validator';

export class StatusReasonRequestDto {
  @ApiProperty({ enum: ['ACTIVE', 'SUSPENDED', 'INACTIVE'] })
  @IsIn(['ACTIVE', 'SUSPENDED', 'INACTIVE'])
  status!: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';

  @ApiProperty()
  @IsString()
  @Length(3, 255)
  reason!: string;
}
