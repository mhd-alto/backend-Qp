import { Injectable, NotFoundException } from '@nestjs/common';
import { FRIENDLY_MESSAGES } from '../../../../common/constants/localized-messages';
import { OfferDetailsWithReasonResponseDto } from '../../api/dto/public-offer-detail.response';
import { PublicOfferReadRepository } from '../../infrastructure/persistence/typeorm/public-offer.read-repository';
import { ResolveAttributionContextService } from '../resolve-attribution-context/resolve-attribution-context.service';

@Injectable()
export class GetPublicOfferService {
  constructor(
    private readonly publicOfferReadRepository: PublicOfferReadRepository,
    private readonly resolveAttributionContextService: ResolveAttributionContextService,
  ) {}

  async getBySlug(
    slug: string,
    sourceToken?: string,
  ): Promise<OfferDetailsWithReasonResponseDto> {
    const offer = await this.publicOfferReadRepository.getPublicOfferBySlug(slug);

    if (!offer) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: FRIENDLY_MESSAGES.RESOURCE_NOT_FOUND,
      });
    }

    if (sourceToken?.trim()) {
      await this.resolveAttributionContextService.resolve({
        campaignId: offer.id,
        trackingToken: sourceToken,
        entryPoint: 'DIRECT',
      });
    }

    return {
      ...offer,
      availabilityMessage: this.getAvailabilityMessage(offer.availability),
    };
  }

  private getAvailabilityMessage(
    availability: string,
  ): { ar: string; en: string } | null {
    switch (availability) {
      case 'AVAILABLE':
        return {
          ar: 'العرض متاح حالياً.',
          en: 'This offer is currently available.',
        };
      case 'NOT_STARTED':
        return {
          ar: 'هذا العرض لم يبدأ بعد.',
          en: 'This offer has not started yet.',
        };
      case 'EXPIRED':
        return {
          ar: 'انتهت صلاحية هذا العرض.',
          en: 'This offer has expired.',
        };
      case 'SUSPENDED':
        return {
          ar: 'هذا العرض غير متاح حالياً.',
          en: 'This offer is not available right now.',
        };
      case 'SOLD_OUT':
        return {
          ar: 'نفدت الكمية المتاحة لهذا العرض.',
          en: 'This offer is sold out.',
        };
      default:
        return {
          ar: 'هذا العرض غير متاح حالياً.',
          en: 'This offer is unavailable right now.',
        };
    }
  }
}
