import { ApiProperty } from '@nestjs/swagger';

export class CurrentUserResponseDto {
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
