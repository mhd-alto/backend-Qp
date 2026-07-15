import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { FRIENDLY_MESSAGES } from '../../../../common/constants/localized-messages';
import { AuthenticatedPrincipal } from '../../../../common/types/authenticated-principal';
import { RedemptionOrmEntity } from '../../infrastructure/persistence/typeorm/entities/redemption.orm-entity';
import { BusinessMembershipOrmEntity } from '../../../organizations/infrastructure/persistence/typeorm/entities/business-membership.orm-entity';
import { MembershipBranchOrmEntity } from '../../../organizations/infrastructure/persistence/typeorm/entities/membership-branch.orm-entity';
import { BranchOrmEntity } from '../../../organizations/infrastructure/persistence/typeorm/entities/branch.orm-entity';
import { CampaignOrmEntity } from '../../../campaigns/infrastructure/persistence/typeorm/entities/campaign.orm-entity';
import { BusinessOrmEntity } from '../../../organizations/infrastructure/persistence/typeorm/entities/business.orm-entity';
import { RedemptionPageResponseDto } from '../../api/dto/redemption.response';

@Injectable()
export class ListStaffRedemptionsService {
  constructor(
    @InjectRepository(RedemptionOrmEntity)
    private readonly redemptionRepository: Repository<RedemptionOrmEntity>,
    @InjectRepository(BusinessMembershipOrmEntity)
    private readonly membershipRepository: Repository<BusinessMembershipOrmEntity>,
    @InjectRepository(MembershipBranchOrmEntity)
    private readonly membershipBranchRepository: Repository<MembershipBranchOrmEntity>,
  ) {}

  async execute(
    actor: AuthenticatedPrincipal,
    query: { page?: number; limit?: number },
  ): Promise<RedemptionPageResponseDto> {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);

    // 1. Resolve staff branch and business
    const membership = await this.membershipRepository.findOne({
      where: { userId: actor.id, status: 'ACTIVE', role: 'STAFF' },
    });

    if (!membership) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: FRIENDLY_MESSAGES.FORBIDDEN,
      });
    }

    const mb = await this.membershipBranchRepository.findOne({
      where: { membershipId: membership.id },
    });

    if (!mb) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: FRIENDLY_MESSAGES.FORBIDDEN,
      });
    }

    const branch = await this.membershipBranchRepository.manager.findOne(BranchOrmEntity, {
      where: { id: mb.branchId },
    });

    if (!branch || branch.status !== 'ACTIVE' || branch.deletedAt) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: FRIENDLY_MESSAGES.FORBIDDEN,
      });
    }

    const qb = this.redemptionRepository
      .createQueryBuilder('r')
      .where('r.businessId = :businessId', { businessId: mb.businessId })
      .andWhere('r.branchId = :branchId', { branchId: mb.branchId })
      .orderBy('r.redeemedAt', 'DESC');

    const total = await qb.getCount();
    qb.skip((page - 1) * limit).take(limit);

    const items = await qb.getMany();

    const campaignIds = [...new Set(items.map((i) => i.campaignId))];
    const businessIds = [...new Set(items.map((i) => i.businessId))];

    const [campaigns, businesses] = await Promise.all([
      campaignIds.length > 0
        ? this.redemptionRepository.manager.find(CampaignOrmEntity, {
            where: { id: In(campaignIds) },
            select: ['id', 'title'],
          })
        : [],
      businessIds.length > 0
        ? this.redemptionRepository.manager.find(BusinessOrmEntity, {
            where: { id: In(businessIds) },
            select: ['id', 'displayName'],
          })
        : [],
    ]);

    const campaignMap = new Map(campaigns.map((c) => [c.id, c.title]));
    const businessMap = new Map(businesses.map((b) => [b.id, b.displayName]));

    return {
      items: items.map((r) => ({
        id: r.id,
        couponId: r.couponId,
        campaignId: r.campaignId,
        businessId: r.businessId,
        branchId: r.branchId,
        redeemedByMembershipId: r.redeemedByMembershipId,
        redeemedAt: r.redeemedAt.toISOString(),
        status: r.status,
        originalAmount: r.originalAmount ? Number(r.originalAmount) : null,
        discountAmount: r.discountAmount ? Number(r.discountAmount) : null,
        finalAmount: r.finalAmount ? Number(r.finalAmount) : null,
        currencyCode: r.currencyCode,
        offerTitle: campaignMap.get(r.campaignId),
        businessName: businessMap.get(r.businessId),
      })),
      meta: {
        page,
        limit,
        total,
      },
    };
  }
}
