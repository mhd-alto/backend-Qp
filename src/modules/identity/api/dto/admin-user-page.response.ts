import { ApiProperty } from '@nestjs/swagger';
import { UserSummaryResponseDto } from './user-summary.response';

export class AdminUserPageMetaDto {
  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  pageCount!: number;
}

export class AdminUserPageResponseDto {
  @ApiProperty({ type: UserSummaryResponseDto, isArray: true })
  items!: UserSummaryResponseDto[];

  @ApiProperty({ type: AdminUserPageMetaDto })
  meta!: AdminUserPageMetaDto;
}
