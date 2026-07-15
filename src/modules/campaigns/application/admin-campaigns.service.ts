import {
  BadRequestException,
  Inject,
  Injectable,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FRIENDLY_MESSAGES } from '../../../common/constants/localized-messages';
import { AuthenticatedPrincipal } from '../../../common/types/authenticated-principal';
import { AUDIT_WRITER } from '../../audit/contracts/audit.tokens';
import { AuditWriter } from '../../audit/contracts/audit-writer';
import { ListCampaignsQueryDto } from '../api/dto/campaign.query';
import { ReviewReasonRequestDto } from '../api/dto/review-reason.request';
import { CampaignReadRepository } from '../infrastructure/persistence/typeorm/queries/campaign-read.repository';
import { CampaignOrmEntity } from '../infrastructure/persistence/typeorm/entities/campaign.orm-entity';
import { CampaignAccessService } from './shared/campaign-access.service';
import {
  BUSINESS_REPOSITORY,
  BusinessRepository,
} from '../../organizations/domain/repositories/business.repository';

@Injectable()
export class AdminCampaignsService {
  constructor(
    @InjectRepository(CampaignOrmEntity)
    private readonly campaignRepository: Repository<CampaignOrmEntity>,
    @Inject(BUSINESS_REPOSITORY)
    private readonly businessRepository: BusinessRepository,
    @Inject(AUDIT_WRITER)
    private readonly auditWriter: AuditWriter,
    private readonly accessService: CampaignAccessService,
    private readonly readRepository: CampaignReadRepository,
  ) {}

  async list(query: ListCampaignsQueryDto) {
    const result = await this.readRepository.listAdminCampaigns(
      query.status,
      query.page,
      query.limit,
    );

    return {
      items: result.items,
      meta: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        pageCount: Math.max(1, Math.ceil(result.total / query.limit)),
      },
    };
  }

  async getById(campaignId: string) {
    return this.readRepository.getCampaignDetails(campaignId);
  }

  async approve(campaignId: string, actor: AuthenticatedPrincipal) {
    const campaign = await this.accessService.requireCampaign(campaignId);

    if (campaign.status !== 'PENDING_REVIEW') {
      throw new ConflictException({
        code: 'CAMPAIGN_NOT_ACTIVE',
        message: {
          ar: 'لا يمكن اعتماد هذه الحملة في حالتها الحالية.',
          en: 'This campaign cannot be approved in its current state.',
        },
      });
    }

    const business = await this.businessRepository.findById(campaign.businessId);

    if (!business || business.status !== 'ACTIVE') {
      throw new ConflictException({
        code: 'FORBIDDEN',
        message: {
          ar: 'لا يمكن اعتماد الحملة لأن النشاط التجاري غير متاح.',
          en: 'The campaign cannot be approved because the business is unavailable.',
        },
      });
    }

    const now = new Date();
    const nextStatus = campaign.startAt > now ? 'SCHEDULED' : 'ACTIVE';

    await this.campaignRepository.update(
      { id: campaignId },
      {
        status: nextStatus,
        reviewedByUserId: actor.id,
        reviewedAt: now,
        publishedAt: now,
        rejectionReason: null,
      },
    );

    await this.auditWriter.write({
      actorUserId: actor.id,
      businessId: campaign.businessId,
      action: 'CAMPAIGN_APPROVED',
      entityType: 'CAMPAIGN',
      entityId: campaignId,
      metadata: {
        status: nextStatus,
      },
    });

    return this.readRepository.getCampaignDetails(campaignId);
  }

  async reject(
    campaignId: string,
    body: ReviewReasonRequestDto,
    actor: AuthenticatedPrincipal,
  ) {
    const campaign = await this.accessService.requireCampaign(campaignId);

    if (campaign.status !== 'PENDING_REVIEW') {
      throw new ConflictException({
        code: 'CAMPAIGN_NOT_ACTIVE',
        message: {
          ar: 'لا يمكن رفض هذه الحملة في حالتها الحالية.',
          en: 'This campaign cannot be rejected in its current state.',
        },
      });
    }

    await this.campaignRepository.update(
      { id: campaignId },
      {
        status: 'REJECTED',
        reviewedByUserId: actor.id,
        reviewedAt: new Date(),
        rejectionReason: body.reason.trim(),
      },
    );

    await this.auditWriter.write({
      actorUserId: actor.id,
      businessId: campaign.businessId,
      action: 'CAMPAIGN_REJECTED',
      entityType: 'CAMPAIGN',
      entityId: campaignId,
    });

    return this.readRepository.getCampaignDetails(campaignId);
  }

  async suspend(
    campaignId: string,
    body: ReviewReasonRequestDto,
    actor: AuthenticatedPrincipal,
  ) {
    const campaign = await this.accessService.requireCampaign(campaignId);

    if (!['SCHEDULED', 'ACTIVE'].includes(campaign.status)) {
      throw new ConflictException({
        code: 'CAMPAIGN_NOT_ACTIVE',
        message: {
          ar: 'لا يمكن تعليق هذه الحملة في حالتها الحالية.',
          en: 'This campaign cannot be suspended in its current state.',
        },
      });
    }

    await this.campaignRepository.update(
      { id: campaignId },
      {
        status: 'SUSPENDED',
        suspendedByUserId: actor.id,
        suspendedAt: new Date(),
        suspensionReason: body.reason.trim(),
      },
    );

    await this.auditWriter.write({
      actorUserId: actor.id,
      businessId: campaign.businessId,
      action: 'CAMPAIGN_SUSPENDED',
      entityType: 'CAMPAIGN',
      entityId: campaignId,
    });

    return this.readRepository.getCampaignDetails(campaignId);
  }

  async reactivate(campaignId: string, actor: AuthenticatedPrincipal) {
    const campaign = await this.accessService.requireCampaign(campaignId);

    if (campaign.status !== 'SUSPENDED') {
      throw new ConflictException({
        code: 'CAMPAIGN_NOT_ACTIVE',
        message: {
          ar: 'لا يمكن إعادة تفعيل هذه الحملة في حالتها الحالية.',
          en: 'This campaign cannot be reactivated in its current state.',
        },
      });
    }

    const business = await this.businessRepository.findById(campaign.businessId);

    if (!business || business.status !== 'ACTIVE') {
      throw new ConflictException({
        code: 'FORBIDDEN',
        message: {
          ar: 'لا يمكن إعادة التفعيل لأن النشاط التجاري غير متاح.',
          en: 'The campaign cannot be reactivated because the business is unavailable.',
        },
      });
    }

    const now = new Date();

    if (campaign.endAt <= now) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: {
          ar: 'لا يمكن إعادة تفعيل حملة منتهية.',
          en: 'An expired campaign cannot be reactivated.',
        },
      });
    }

    const nextStatus = campaign.startAt > now ? 'SCHEDULED' : 'ACTIVE';

    await this.campaignRepository.update(
      { id: campaignId },
      {
        status: nextStatus,
        suspensionReason: null,
        suspendedAt: null,
        suspendedByUserId: null,
      },
    );

    await this.auditWriter.write({
      actorUserId: actor.id,
      businessId: campaign.businessId,
      action: 'CAMPAIGN_REACTIVATED',
      entityType: 'CAMPAIGN',
      entityId: campaignId,
      metadata: {
        status: nextStatus,
      },
    });

    return this.readRepository.getCampaignDetails(campaignId);
  }
}
