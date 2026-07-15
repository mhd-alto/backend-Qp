import { Injectable, NotFoundException } from '@nestjs/common';
import { FRIENDLY_MESSAGES } from '../../../../common/constants/localized-messages';
import { AuthenticatedPrincipal } from '../../../../common/types/authenticated-principal';
import { RecordVisitRequestDto } from '../../api/dto/record-visit.request';
import { PublicOfferReadRepository } from '../../infrastructure/persistence/typeorm/public-offer.read-repository';
import { ResolveAttributionContextService } from '../resolve-attribution-context/resolve-attribution-context.service';

@Injectable()
export class RecordCampaignVisitService {
  constructor(
    private readonly publicOfferReadRepository: PublicOfferReadRepository,
    private readonly resolveAttributionContextService: ResolveAttributionContextService,
  ) {}

  async record(
    campaignId: string,
    body: RecordVisitRequestDto,
    actor: AuthenticatedPrincipal | null,
  ) {
    const campaign = await this.publicOfferReadRepository.findCampaignById(campaignId);

    if (!campaign) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: FRIENDLY_MESSAGES.RESOURCE_NOT_FOUND,
      });
    }

    const resolvedSource = await this.resolveAttributionContextService.resolve({
      campaignId,
      trackingToken: body.trackingToken,
      entryPoint: body.entryPoint,
    });

    await this.publicOfferReadRepository.insertCampaignVisit({
      campaignId,
      sourceId: resolvedSource.sourceId,
      userId: actor?.id ?? null,
      visitorHash: body.visitorHash?.trim() || null,
    });

    return {
      sourceId: resolvedSource.sourceId,
      sourceType: resolvedSource.sourceType,
      trackingToken: resolvedSource.trackingToken,
    };
  }
}
