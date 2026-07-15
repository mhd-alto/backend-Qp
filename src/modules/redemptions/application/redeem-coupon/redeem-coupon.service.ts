import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { FRIENDLY_MESSAGES } from '../../../../common/constants/localized-messages';
import { AuthenticatedPrincipal } from '../../../../common/types/authenticated-principal';
import { AUDIT_WRITER } from '../../../audit/contracts/audit.tokens';
import { AuditWriter } from '../../../audit/contracts/audit-writer';
import { RedemptionOrmEntity } from '../../infrastructure/persistence/typeorm/entities/redemption.orm-entity';
import { CouponOrmEntity } from '../../../coupons/infrastructure/persistence/typeorm/entities/coupon.orm-entity';
import { CampaignOrmEntity } from '../../../campaigns/infrastructure/persistence/typeorm/entities/campaign.orm-entity';
import { CampaignBenefitOrmEntity } from '../../../campaigns/infrastructure/persistence/typeorm/entities/campaign-benefit.orm-entity';
import { CampaignBranchOrmEntity } from '../../../campaigns/infrastructure/persistence/typeorm/entities/campaign-branch.orm-entity';
import { BusinessMembershipOrmEntity } from '../../../organizations/infrastructure/persistence/typeorm/entities/business-membership.orm-entity';
import { MembershipBranchOrmEntity } from '../../../organizations/infrastructure/persistence/typeorm/entities/membership-branch.orm-entity';
import { BusinessOrmEntity } from '../../../organizations/infrastructure/persistence/typeorm/entities/business.orm-entity';
import { BranchOrmEntity } from '../../../organizations/infrastructure/persistence/typeorm/entities/branch.orm-entity';
import { RedemptionResponseDto } from '../../api/dto/redemption.response';
import { RedeemCouponRequestDto } from '../../api/dto/redeem-coupon.request';
import { calculateDiscount } from '../../../impact/savings-calculator/savings-calculator';

@Injectable()
export class RedeemCouponService {
  constructor(
    private readonly dataSource: DataSource,
    @Inject(AUDIT_WRITER)
    private readonly auditWriter: AuditWriter,
    @InjectRepository(RedemptionOrmEntity)
    private readonly redemptionRepository: Repository<RedemptionOrmEntity>,
    @InjectRepository(CouponOrmEntity)
    private readonly couponRepository: Repository<CouponOrmEntity>,
    @InjectRepository(CampaignOrmEntity)
    private readonly campaignRepository: Repository<CampaignOrmEntity>,
    @InjectRepository(CampaignBranchOrmEntity)
    private readonly campaignBranchRepository: Repository<CampaignBranchOrmEntity>,
    @InjectRepository(BusinessOrmEntity)
    private readonly businessRepository: Repository<BusinessOrmEntity>,
  ) {}

  async execute(
    couponId: string,
    body: RedeemCouponRequestDto,
    actor: AuthenticatedPrincipal,
  ): Promise<{ existing: boolean; redemption: RedemptionResponseDto }> {
    const now = new Date();

    const result = await this.dataSource.transaction(async (manager) => {
      // 1. Resolve staff member active membership
      const membership = await manager.findOne(BusinessMembershipOrmEntity, {
        where: { userId: actor.id, status: 'ACTIVE', role: 'STAFF' },
      });

      if (!membership) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: FRIENDLY_MESSAGES.FORBIDDEN,
        });
      }

      const mb = await manager.findOne(MembershipBranchOrmEntity, {
        where: { membershipId: membership.id },
      });

      if (!mb) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: FRIENDLY_MESSAGES.FORBIDDEN,
        });
      }

      const staffBranchId = mb.branchId;
      const staffBusinessId = mb.businessId;

      // Verify active branch status
      const branch = await manager.findOne(BranchOrmEntity, {
        where: { id: staffBranchId },
      });

      if (!branch || branch.status !== 'ACTIVE' || branch.deletedAt) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: FRIENDLY_MESSAGES.FORBIDDEN,
        });
      }

      // 2. Get coupon with pessimistic write lock
      const coupon = await manager.findOne(CouponOrmEntity, {
        where: { id: couponId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!coupon) {
        throw new NotFoundException({
          code: 'RESOURCE_NOT_FOUND',
          message: FRIENDLY_MESSAGES.RESOURCE_NOT_FOUND,
        });
      }

      // 3. Get campaign
      const campaign = await manager.findOne(CampaignOrmEntity, {
        where: { id: coupon.campaignId },
      });

      if (!campaign || campaign.deletedAt) {
        throw new NotFoundException({
          code: 'RESOURCE_NOT_FOUND',
          message: FRIENDLY_MESSAGES.RESOURCE_NOT_FOUND,
        });
      }

      const business = await manager.findOneOrFail(BusinessOrmEntity, {
        where: { id: campaign.businessId },
      });

      // 4. Verify business ownership
      if (campaign.businessId !== staffBusinessId) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: FRIENDLY_MESSAGES.FORBIDDEN,
        });
      }

      // 5. Check for existing confirmation (Idempotency - SECURELY RUN AFTER OWNERSHIP CHECK)
      const existing = await manager.findOne(RedemptionOrmEntity, {
        where: { couponId },
      });

      if (existing) {
        return { existing: true, redemption: existing };
      }

      // 6. Validate status
      if (coupon.status === 'REDEEMED') {
        throw new ConflictException({
          code: 'ALREADY_REDEEMED',
          message: {
            ar: 'تم استخدام هذا الكوبون بالفعل.',
            en: 'This coupon has already been redeemed.',
          },
        });
      }

      if (coupon.status === 'CANCELLED') {
        throw new ConflictException({
          code: 'COUPON_CANCELLED',
          message: {
            ar: 'هذا الكوبون ملغى ولا يمكن استخدامه.',
            en: 'This coupon has been cancelled and cannot be redeemed.',
          },
        });
      }

      if (coupon.status === 'SUSPENDED') {
        throw new ConflictException({
          code: 'COUPON_SUSPENDED',
          message: {
            ar: 'هذا الكوبون معلق ولا يمكن استخدامه حالياً.',
            en: 'This coupon is suspended and cannot be redeemed right now.',
          },
        });
      }

      // 7. Validate expiration
      if (coupon.expiresAt < now) {
        throw new ConflictException({
          code: 'COUPON_EXPIRED',
          message: {
            ar: 'انتهت صلاحية هذا الكوبون.',
            en: 'This coupon has expired.',
          },
        });
      }

      // 8. Validate campaign status and time window
      if (campaign.status === 'SUSPENDED') {
        throw new ConflictException({
          code: 'CAMPAIGN_SUSPENDED',
          message: {
            ar: 'تم تعليق هذه الحملة مؤقتاً.',
            en: 'This campaign is suspended.',
          },
        });
      }

      if (campaign.status !== 'ACTIVE' || campaign.startAt > now || campaign.endAt < now) {
        throw new ConflictException({
          code: 'CAMPAIGN_INACTIVE',
          message: {
            ar: 'هذه الحملة غير نشطة حالياً.',
            en: 'This campaign is not active right now.',
          },
        });
      }

      // 9. Validate branch link
      const campaignBranch = await manager.findOne(CampaignBranchOrmEntity, {
        where: { campaignId: campaign.id, branchId: staffBranchId },
      });

      if (!campaignBranch) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: {
            ar: 'هذا الكوبون غير مخصص للاستخدام في هذا الفرع.',
            en: 'This coupon is not allowed to be redeemed in this branch.',
          },
        });
      }

      // 10. Check business status
      if (business.status !== 'ACTIVE') {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: {
            ar: 'هذا النشاط التجاري غير متاح حالياً.',
            en: 'This business is not active right now.',
          },
        });
      }

      // 11. Confirm redemption
      await manager.update(CouponOrmEntity, couponId, {
        status: 'REDEEMED',
      });

      // Calculate discount and final amounts if originalAmount is provided
      let calculatedDiscount: number | null = null;
      let finalAmount: number | null = null;
      const benefit = await manager.findOne(CampaignBenefitOrmEntity, {
        where: { campaignId: campaign.id },
      });

      if (body.originalAmount !== undefined && body.originalAmount !== null) {
        const original = Number(body.originalAmount);
        if (benefit) {
          const calc = calculateDiscount({
            originalAmount: original,
            benefitType: benefit.benefitType,
            percentageValue: benefit.percentageValue ? Number(benefit.percentageValue) : null,
            fixedAmount: benefit.fixedAmount ? Number(benefit.fixedAmount) : null,
            maxDiscountAmount: benefit.maxDiscountAmount ? Number(benefit.maxDiscountAmount) : null,
          });
          calculatedDiscount = calc.discountAmount;
          finalAmount = calc.finalAmount;
        } else {
          calculatedDiscount = 0;
          finalAmount = original;
        }
      }

      const currencyCode = body.currencyCode || benefit?.currency || 'SYP';

      const redemption = manager.create(RedemptionOrmEntity, {
        couponId: coupon.id,
        campaignId: coupon.campaignId,
        businessId: staffBusinessId,
        branchId: staffBranchId,
        redeemedByMembershipId: membership.id,
        status: 'CONFIRMED',
        redeemedAt: now,
        originalAmount: body.originalAmount !== undefined && body.originalAmount !== null ? String(body.originalAmount) : null,
        discountAmount: calculatedDiscount !== null ? String(calculatedDiscount) : null,
        finalAmount: finalAmount !== null ? String(finalAmount) : null,
        currencyCode: currencyCode,
      });

      const savedRedemption = await manager.save(RedemptionOrmEntity, redemption);

      // 12. Write audit log INSIDE same transaction context (passing manager)
      await this.auditWriter.write({
        actorUserId: actor.id,
        businessId: staffBusinessId,
        action: 'COUPON_REDEEMED',
        entityType: 'REDEMPTION',
        entityId: savedRedemption.id,
        metadata: {
          couponId: coupon.id,
          campaignId: coupon.campaignId,
        },
      }, manager);

      return { existing: false, redemption: savedRedemption };
    });

    return {
      existing: result.existing,
      redemption: {
        id: result.redemption.id,
        couponId: result.redemption.couponId,
        campaignId: result.redemption.campaignId,
        businessId: result.redemption.businessId,
        branchId: result.redemption.branchId,
        redeemedByMembershipId: result.redemption.redeemedByMembershipId,
        redeemedAt: result.redemption.redeemedAt.toISOString(),
        status: result.redemption.status,
        originalAmount: result.redemption.originalAmount ? Number(result.redemption.originalAmount) : null,
        discountAmount: result.redemption.discountAmount ? Number(result.redemption.discountAmount) : null,
        finalAmount: result.redemption.finalAmount ? Number(result.redemption.finalAmount) : null,
        currencyCode: result.redemption.currencyCode,
      },
    };
  }
}
