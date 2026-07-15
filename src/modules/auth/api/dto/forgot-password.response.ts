import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ForgotPasswordResponseDto {
  @ApiProperty({
    example: 'If the account exists, reset instructions have been prepared.',
  })
  message!: string;

  @ApiPropertyOptional({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'Development-only reset token for local testing.',
    nullable: true,
  })
  resetToken?: string | null;
}
