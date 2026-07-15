import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SmartSearchRequestDto {
  @ApiProperty({
    example: 'بدي عرض عشا بالمزة اليوم',
    description: 'Natural language search query in Arabic or English',
  })
  @IsString()
  @IsNotEmpty()
  queryText!: string;
}
