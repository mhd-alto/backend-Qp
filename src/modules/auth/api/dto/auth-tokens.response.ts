import { ApiProperty } from '@nestjs/swagger';

export class AuthTokensResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ example: 900, description: 'Access token lifetime in seconds' })
  accessTokenExpiresIn!: number;
}

export class AuthUserSummaryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty({ nullable: true, example: 'user@example.com' })
  email!: string | null;

  @ApiProperty({ nullable: true, example: '+963912345678' })
  phone!: string | null;

  @ApiProperty({ example: 'USER' })
  platformRole!: string;

  @ApiProperty({ example: 'ACTIVE' })
  status!: string;
}

export class AuthResponseDto {
  @ApiProperty({ type: AuthUserSummaryResponseDto })
  user!: AuthUserSummaryResponseDto;

  @ApiProperty({ type: AuthTokensResponseDto })
  tokens!: AuthTokensResponseDto;
}
