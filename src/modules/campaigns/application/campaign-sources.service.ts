import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { FRIENDLY_MESSAGES } from '../../../common/constants/localized-messages';
import { AuthenticatedPrincipal } from '../../../common/types/authenticated-principal';
import { AUDIT_WRITER } from '../../audit/contracts/audit.tokens';
import { AuditWriter } from '../../audit/contracts/audit-writer';
import {
  CreateCampaignSourceRequestDto,
  SourceStatusRequestDto,
} from '../api/dto/campaign-source.request';
import { CampaignReadRepository } from '../infrastructure/persistence/typeorm/queries/campaign-read.repository';
import { CampaignSourceOrmEntity } from '../infrastructure/persistence/typeorm/entities/campaign-source.orm-entity';
import { CampaignAccessService } from './shared/campaign-access.service';

@Injectable()
export class CampaignSourcesService {
  constructor(
    @InjectRepository(CampaignSourceOrmEntity)
    private readonly sourceRepository: Repository<CampaignSourceOrmEntity>,
    @Inject(AUDIT_WRITER)
    private readonly auditWriter: AuditWriter,
    private readonly accessService: CampaignAccessService,
    private readonly readRepository: CampaignReadRepository,
  ) {}

  async list(campaignId: string, actor: AuthenticatedPrincipal) {
    await this.accessService.requireOwnedCampaign(actor, campaignId);
    return this.readRepository.listCampaignSources(campaignId);
  }

  async create(
    campaignId: string,
    body: CreateCampaignSourceRequestDto,
    actor: AuthenticatedPrincipal,
  ) {
    const context = await this.accessService.requireOwnedCampaign(actor, campaignId);
    const existing = await this.sourceRepository.findOne({
      where: { campaignId, label: body.label.trim() },
    });

    if (existing) {
      throw new ConflictException({
        code: 'IDENTIFIER_ALREADY_IN_USE',
        message: {
          ar: 'اسم مصدر التتبع مستخدم بالفعل في هذه الحملة.',
          en: 'This source label already exists in the campaign.',
        },
      });
    }

    const source = await this.sourceRepository.save(
      this.sourceRepository.create({
        campaignId,
        businessId: context.business.id,
        createdByMembershipId: context.membership.id,
        sourceType: body.sourceType,
        label: body.label.trim(),
        labelEn: body.labelEn?.trim() ?? null,
        trackingToken: this.generateTrackingToken(),
        status: 'ACTIVE',
        isSystemGenerated: false,
      }),
    );

    await this.auditWriter.write({
      actorUserId: actor.id,
      businessId: context.business.id,
      action: 'CAMPAIGN_SOURCE_CREATED',
      entityType: 'CAMPAIGN_SOURCE',
      entityId: source.id,
      metadata: {
        campaignId,
        sourceType: source.sourceType,
      },
    });

    const sources = await this.readRepository.listCampaignSources(campaignId);
    return sources.find((item) => item.id === source.id);
  }

  async changeStatus(
    campaignId: string,
    sourceId: string,
    body: SourceStatusRequestDto,
    actor: AuthenticatedPrincipal,
  ) {
    const context = await this.accessService.requireOwnedCampaign(actor, campaignId);
    const source = await this.sourceRepository.findOne({
      where: { id: sourceId, campaignId, businessId: context.business.id },
    });

    if (!source) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: FRIENDLY_MESSAGES.RESOURCE_NOT_FOUND,
      });
    }

    if (source.isSystemGenerated) {
      throw new ConflictException({
        code: 'FORBIDDEN',
        message: {
          ar: 'لا يمكن تعديل حالة المصدر الافتراضي.',
          en: 'System-generated sources cannot be changed.',
        },
      });
    }

    await this.sourceRepository.update(
      { id: source.id },
      {
        status: body.status,
      },
    );

    await this.auditWriter.write({
      actorUserId: actor.id,
      businessId: context.business.id,
      action: 'CAMPAIGN_SOURCE_STATUS_CHANGED',
      entityType: 'CAMPAIGN_SOURCE',
      entityId: source.id,
      metadata: {
        campaignId,
        status: body.status,
      },
    });

    const sources = await this.readRepository.listCampaignSources(campaignId);
    return sources.find((item) => item.id === source.id);
  }

  private generateTrackingToken(): string {
    return randomBytes(16).toString('hex');
  }
}
