import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class ReviewReasonRequestDto {
  @ApiProperty({
    minLength: 3,
    example: 'The campaign terms are incomplete and need clarification before publication.',
    description:
      'Mandatory admin reason used when rejecting or suspending a campaign.',
  })
  @IsString()
  @Length(3, 2000)
  reason!: string;
}
