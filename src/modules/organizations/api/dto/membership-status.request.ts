import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class MembershipStatusRequestDto {
  @ApiProperty({ enum: ['ACTIVE', 'SUSPENDED', 'REMOVED'] })
  @IsIn(['ACTIVE', 'SUSPENDED', 'REMOVED'])
  status!: 'ACTIVE' | 'SUSPENDED' | 'REMOVED';
}
