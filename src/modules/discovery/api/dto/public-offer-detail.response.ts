import { ApiPropertyOptional } from '@nestjs/swagger';
import { OfferDetailsResponseDto } from './public-offer.response';

export class OfferDetailsWithReasonResponseDto extends OfferDetailsResponseDto {
  @ApiPropertyOptional({
    nullable: true,
    description: 'Friendly localized availability hint for direct UI display.',
  })
  availabilityMessage!: { ar: string; en: string } | null;
}
