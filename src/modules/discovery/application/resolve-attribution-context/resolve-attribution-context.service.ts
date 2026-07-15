import { Injectable, NotFoundException } from '@nestjs/common';
import { FRIENDLY_MESSAGES } from '../../../../common/constants/localized-messages';
import { AttributionContextReader } from '../../contracts/attribution-context-reader';
import { AttributionContext } from '../../domain/attribution/attribution-context';
import {
  AttributionEntryPoint,
  AttributionPolicy,
} from '../../domain/attribution/attribution.policy';
import { PublicOfferReadRepository } from '../../infrastructure/persistence/typeorm/public-offer.read-repository';

type ResolveInput = {
  campaignId: string;
  trackingToken?: string | null;
  entryPoint?: AttributionEntryPoint;
};

@Injectable()
export class ResolveAttributionContextService implements AttributionContextReader {
  constructor(
    private readonly publicOfferReadRepository: PublicOfferReadRepository,
  ) {}

  async resolve(input: ResolveInput): Promise<AttributionContext> {
    const normalizedToken = input.trackingToken?.trim() || undefined;

    if (normalizedToken) {
      const trackedSource =
        await this.publicOfferReadRepository.findActiveSourceByTrackingToken(
          input.campaignId,
          normalizedToken,
        );

      if (trackedSource) {
        return trackedSource;
      }
    }

    const fallbackSourceType = AttributionPolicy.resolveFallbackSourceType(
      input.entryPoint ?? 'DIRECT',
    );
    const fallbackSource = await this.publicOfferReadRepository.findActiveSystemSource(
      input.campaignId,
      fallbackSourceType,
    );

    if (fallbackSource) {
      return fallbackSource;
    }

    const directSource = await this.publicOfferReadRepository.findActiveSystemSource(
      input.campaignId,
      'DIRECT',
    );

    if (directSource) {
      return directSource;
    }

    throw new NotFoundException({
      code: 'RESOURCE_NOT_FOUND',
      message: FRIENDLY_MESSAGES.RESOURCE_NOT_FOUND,
    });
  }
}
