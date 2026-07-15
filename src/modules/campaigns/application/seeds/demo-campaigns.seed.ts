import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { normalizeEmail } from "../../../../common/utilities/normalize-email";
import { UserOrmEntity } from "../../../identity/infrastructure/persistence/typeorm/entities/user.orm-entity";
import { BranchOrmEntity } from "../../../organizations/infrastructure/persistence/typeorm/entities/branch.orm-entity";
import { BusinessMembershipOrmEntity } from "../../../organizations/infrastructure/persistence/typeorm/entities/business-membership.orm-entity";
import { BusinessOrmEntity } from "../../../organizations/infrastructure/persistence/typeorm/entities/business.orm-entity";
import { CategoryOrmEntity } from "../../../reference-data/infrastructure/persistence/typeorm/entities/category.orm-entity";
import { CampaignBenefitOrmEntity } from "../../infrastructure/persistence/typeorm/entities/campaign-benefit.orm-entity";
import { CampaignBranchOrmEntity } from "../../infrastructure/persistence/typeorm/entities/campaign-branch.orm-entity";
import { CampaignLimitOrmEntity } from "../../infrastructure/persistence/typeorm/entities/campaign-limit.orm-entity";
import { CampaignOrmEntity } from "../../infrastructure/persistence/typeorm/entities/campaign.orm-entity";
import { CampaignSourceOrmEntity } from "../../infrastructure/persistence/typeorm/entities/campaign-source.orm-entity";

type DemoCampaignSeed = {
  businessSlug: string;
  categorySlug: string;
  branchSlug: string;
  publicSlug: string;
  title: string;
  titleEn: string | null;
  description: string;
  descriptionEn: string | null;
  imageUrl: string | null;
  termsText: string;
  termsTextEn: string | null;
  status: string;
  startAt: Date;
  endAt: Date;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  publishedAt: Date | null;
  suspendedAt: Date | null;
  suspensionReason: string | null;
  isSearchable: boolean;
  benefit: {
    benefitType: "PERCENTAGE" | "FIXED_AMOUNT";
    percentageValue: string | null;
    fixedAmount: string | null;
    maxDiscountAmount: string | null;
    currency: string;
    description: string | null;
    descriptionEn: string | null;
  };
  limits: {
    totalClaimLimit: number;
    perUserClaimLimit: number;
    maxRedemptionsPerCoupon: number;
    budgetAmount: string | null;
    currency: string | null;
  };
  customSources: Array<{
    sourceType: string;
    label: string;
    labelEn: string | null;
    trackingToken: string;
    status: string;
  }>;
};

@Injectable()
export class DemoCampaignsSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DemoCampaignsSeedService.name);

  constructor(
    @InjectRepository(CampaignOrmEntity)
    private readonly campaignsRepository: Repository<CampaignOrmEntity>,
    @InjectRepository(CampaignBenefitOrmEntity)
    private readonly benefitsRepository: Repository<CampaignBenefitOrmEntity>,
    @InjectRepository(CampaignLimitOrmEntity)
    private readonly limitsRepository: Repository<CampaignLimitOrmEntity>,
    @InjectRepository(CampaignBranchOrmEntity)
    private readonly campaignBranchesRepository: Repository<CampaignBranchOrmEntity>,
    @InjectRepository(CampaignSourceOrmEntity)
    private readonly sourcesRepository: Repository<CampaignSourceOrmEntity>,
    @InjectRepository(BusinessOrmEntity)
    private readonly businessesRepository: Repository<BusinessOrmEntity>,
    @InjectRepository(BusinessMembershipOrmEntity)
    private readonly membershipsRepository: Repository<BusinessMembershipOrmEntity>,
    @InjectRepository(BranchOrmEntity)
    private readonly branchesRepository: Repository<BranchOrmEntity>,
    @InjectRepository(CategoryOrmEntity)
    private readonly categoriesRepository: Repository<CategoryOrmEntity>,
    @InjectRepository(UserOrmEntity)
    private readonly usersRepository: Repository<UserOrmEntity>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.ensureDemoCampaigns();
  }

  private async ensureDemoCampaigns(): Promise<void> {
    const adminEmail = normalizeEmail("admin@couponhub-demo.sy");

    if (!adminEmail) {
      this.logger.warn(
        "Skipping demo campaigns seed because platform admin email is invalid",
      );
      return;
    }

    const adminUser = await this.usersRepository.findOne({
      where: {
        email: adminEmail,
      },
    });

    if (!adminUser) {
      this.logger.warn(
        "Skipping demo campaigns seed because platform admin is missing",
      );
      return;
    }

    const now = new Date();
    const seeds = this.buildSeeds(now);

    for (const seed of seeds) {
      await this.seedCampaign(seed, adminUser.id);
    }

    await this.ensureTestCoupons(now);

    this.logger.log("Demo campaigns seed checked");
  }

  private async ensureTestCoupons(now: Date): Promise<void> {
    const customerEmail = normalizeEmail("customer@couponhub-demo.sy");
    if (!customerEmail) {
      return;
    }
    const customer = await this.usersRepository.findOne({
      where: { email: customerEmail },
    });

    if (!customer) {
      this.logger.warn(
        "Skipping test coupons seed because customer is missing",
      );
      return;
    }

    const campaign = await this.campaignsRepository.findOne({
      where: { publicSlug: "beit-al-sham-family-friday" },
    });

    if (!campaign) {
      this.logger.warn(
        "Skipping test coupons seed because campaign is missing",
      );
      return;
    }

    const source = await this.sourcesRepository.findOne({
      where: { campaignId: campaign.id, sourceType: "WHATSAPP" },
    });

    if (!source) {
      this.logger.warn(
        "Skipping test coupons seed because WhatsApp source is missing",
      );
      return;
    }

    const manager = this.campaignsRepository.manager;
    const CouponOrmEntity = (
      await import("../../../coupons/infrastructure/persistence/typeorm/entities/coupon.orm-entity")
    ).CouponOrmEntity;

    const existingCoupon = await manager.findOne(CouponOrmEntity, {
      where: {
        campaignId: campaign.id,
        userId: customer.id,
      },
    });

    if (!existingCoupon) {
      const couponExpires = new Date(now);
      couponExpires.setDate(couponExpires.getDate() + 14);

      await manager.save(
        manager.create(CouponOrmEntity, {
          id: "d1c01e35-515a-4b05-9f5b-9d41334c9c22",
          campaignId: campaign.id,
          userId: customer.id,
          sourceId: source.id,
          code: "SHAM-FRIDAY-50",
          qrToken: "70d9a8c7-b6e5-4a3d-2c1b-0a9b8c7d6e5f",
          status: "AVAILABLE",
          expiresAt: couponExpires,
        }),
      );
      this.logger.log(
        "Demo test coupon created for Beit Al-Sham: SHAM-FRIDAY-50",
      );
    }
  }

  private buildSeeds(now: Date): DemoCampaignSeed[] {
    return [
      {
        businessSlug: "beit-al-sham-grills",
        categorySlug: "grills-and-levantine-cuisine",
        branchSlug: "abu-rummaneh-branch",
        publicSlug: "beit-al-sham-family-friday",
        title: "عرض غداء الجمعة العائلية",
        titleEn: "Family Friday Lunch Offer",
        description:
          "خصم خاص على وجبات المشاوي العائلية مع مقبلات شامية مجانية للحجوزات داخل الصالة.",
        descriptionEn:
          "Special discount on family grill platters with complimentary Levantine appetizers for dine-in reservations.",
        imageUrl:
          "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80",
        termsText:
          "يسري يوم الجمعة فقط. الحسم لا يجمع مع العروض الأخرى. العرض متاح داخل الصالة فقط.",
        termsTextEn:
          "Valid on Fridays only. Not combinable with other offers. Dine-in only.",
        status: "ACTIVE",
        startAt: this.offsetDays(now, -5),
        endAt: this.offsetDays(now, 14),
        submittedAt: this.offsetDays(now, -8),
        reviewedAt: this.offsetDays(now, -7),
        rejectionReason: null,
        publishedAt: this.offsetDays(now, -7),
        suspendedAt: null,
        suspensionReason: null,
        isSearchable: true,
        benefit: {
          benefitType: "PERCENTAGE",
          percentageValue: "20.00",
          fixedAmount: null,
          maxDiscountAmount: "50000.00",
          currency: "SYP",
          description: "خصم على منيو الغداء العائلي",
          descriptionEn: "Discount on family lunch menu",
        },
        limits: {
          totalClaimLimit: 300,
          perUserClaimLimit: 1,
          maxRedemptionsPerCoupon: 1,
          budgetAmount: "7500000.00",
          currency: "SYP",
        },
        customSources: [
          {
            sourceType: "INSTAGRAM",
            label: "انستغرام المطعم",
            labelEn: "Restaurant Instagram",
            trackingToken: "ig-beit-friday",
            status: "ACTIVE",
          },
          {
            sourceType: "WHATSAPP",
            label: "واتساب الزبائن",
            labelEn: "Customer WhatsApp",
            trackingToken: "wa-beit-friday",
            status: "ACTIVE",
          },
        ],
      },
      {
        businessSlug: "yasmin-damascene-sweets",
        categorySlug: "damascene-sweets",
        branchSlug: "shaalan-branch",
        publicSlug: "yasmin-eid-maamoul-boxes",
        title: "عرض علب معمول العيد",
        titleEn: "Eid Maamoul Boxes Offer",
        description:
          "حسم على علب المعمول المشكلة المناسبة للزيارات العائلية والهدايا في موسم العيد.",
        descriptionEn:
          "Discount on assorted maamoul boxes suitable for family visits and festive gifting.",
        imageUrl:
          "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=1200&q=80",
        termsText:
          "يسري قبل العيد بثلاثة أيام وحتى نهاية اليوم الثاني من العيد. الكمية محدودة يومياً.",
        termsTextEn:
          "Valid from three days before Eid until the end of the second Eid day. Daily stock is limited.",
        status: "SCHEDULED",
        startAt: this.offsetDays(now, 3),
        endAt: this.offsetDays(now, 12),
        submittedAt: this.offsetDays(now, -2),
        reviewedAt: this.offsetDays(now, -1),
        rejectionReason: null,
        publishedAt: this.offsetDays(now, -1),
        suspendedAt: null,
        suspensionReason: null,
        isSearchable: true,
        benefit: {
          benefitType: "FIXED_AMOUNT",
          percentageValue: null,
          fixedAmount: "15000.00",
          maxDiscountAmount: null,
          currency: "SYP",
          description: "حسم ثابت على كل علبة ضيافة كبيرة",
          descriptionEn: "Flat discount on every large hospitality box",
        },
        limits: {
          totalClaimLimit: 180,
          perUserClaimLimit: 2,
          maxRedemptionsPerCoupon: 1,
          budgetAmount: "2700000.00",
          currency: "SYP",
        },
        customSources: [
          {
            sourceType: "FACEBOOK",
            label: "صفحة الفيسبوك",
            labelEn: "Facebook Page",
            trackingToken: "fb-yasmin-eid",
            status: "ACTIVE",
          },
        ],
      },
      {
        businessSlug: "old-gate-coffee",
        categorySlug: "specialty-coffee",
        branchSlug: "mazzeh-branch",
        publicSlug: "old-gate-student-combo",
        title: "باقة العودة للجامعة",
        titleEn: "Back to Campus Combo",
        description:
          "مشروب ساخن مع كوكيز بسعر تشجيعي مخصص لطلاب الجامعات في فترة الدوام الصباحي.",
        descriptionEn:
          "A hot drink with cookies at a student-friendly price during morning university hours.",
        imageUrl:
          "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
        termsText:
          "العرض مسودة داخلية وغير منشور بعد. يطبق بين الثامنة صباحاً والثانية عشرة ظهراً.",
        termsTextEn:
          "Internal draft offer not published yet. Intended for 8 AM to 12 PM.",
        status: "DRAFT",
        startAt: this.offsetDays(now, 7),
        endAt: this.offsetDays(now, 27),
        submittedAt: null,
        reviewedAt: null,
        rejectionReason: null,
        publishedAt: null,
        suspendedAt: null,
        suspensionReason: null,
        isSearchable: false,
        benefit: {
          benefitType: "FIXED_AMOUNT",
          percentageValue: null,
          fixedAmount: "8000.00",
          maxDiscountAmount: null,
          currency: "SYP",
          description: "سعر تشجيعي لطلاب الجامعة",
          descriptionEn: "Student-friendly combo pricing",
        },
        limits: {
          totalClaimLimit: 120,
          perUserClaimLimit: 1,
          maxRedemptionsPerCoupon: 1,
          budgetAmount: "960000.00",
          currency: "SYP",
        },
        customSources: [
          {
            sourceType: "INFLUENCER",
            label: "مؤثر جامعي محلي",
            labelEn: "Local Campus Influencer",
            trackingToken: "inf-oldgate-campus",
            status: "ACTIVE",
          },
        ],
      },
      {
        businessSlug: "al-shifa-pharmacy",
        categorySlug: "pharmacies",
        branchSlug: "kafr-souseh-branch",
        publicSlug: "shifa-summer-care-bundle",
        title: "حزمة العناية الصيفية",
        titleEn: "Summer Care Bundle",
        description:
          "خصم على واقيات الشمس وبعض منتجات العناية الخفيفة مع إقبال مرتفع في بداية الصيف.",
        descriptionEn:
          "Discount on sunscreen and selected light-care products during the early summer season.",
        imageUrl:
          "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=1200&q=80",
        termsText:
          "تم تعليق الحملة مؤقتاً بانتظار تحديث المخزون والأسعار. لا يمكن استخدام القسائم حالياً.",
        termsTextEn:
          "Temporarily suspended pending stock and pricing updates. Coupons cannot be used at the moment.",
        status: "SUSPENDED",
        startAt: this.offsetDays(now, -9),
        endAt: this.offsetDays(now, 10),
        submittedAt: this.offsetDays(now, -12),
        reviewedAt: this.offsetDays(now, -11),
        rejectionReason: null,
        publishedAt: this.offsetDays(now, -11),
        suspendedAt: this.offsetDays(now, -2),
        suspensionReason:
          "تم تعليق الحملة بسبب تحديث أسعار بعض المنتجات الطبية.",
        isSearchable: true,
        benefit: {
          benefitType: "PERCENTAGE",
          percentageValue: "15.00",
          fixedAmount: null,
          maxDiscountAmount: "25000.00",
          currency: "SYP",
          description: "حسم على منتجات مختارة للعناية الصيفية",
          descriptionEn: "Discount on selected summer care products",
        },
        limits: {
          totalClaimLimit: 240,
          perUserClaimLimit: 2,
          maxRedemptionsPerCoupon: 1,
          budgetAmount: "4000000.00",
          currency: "SYP",
        },
        customSources: [
          {
            sourceType: "WHATSAPP",
            label: "قائمة المرضى الدائمين",
            labelEn: "Loyal Patients WhatsApp",
            trackingToken: "wa-shifa-summer",
            status: "ACTIVE",
          },
        ],
      },
      {
        businessSlug: "shahbaa-market",
        categorySlug: "supermarkets",
        branchSlug: "midan-branch",
        publicSlug: "shahbaa-weekly-basket",
        title: "سلة البيت الأسبوعية",
        titleEn: "Weekly Home Basket",
        description:
          "حسم على باقة مواد غذائية ومنظفات أساسية للعائلات مع استبدال سريع داخل الفرع.",
        descriptionEn:
          "Discount on a bundled basket of essential groceries and household cleaners for families.",
        imageUrl:
          "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
        termsText:
          "بانتظار مراجعة الإدارة. العرض مخصص للاستلام من الفرع فقط ولا يشمل التوصيل.",
        termsTextEn:
          "Pending admin review. Offer is for branch pickup only and excludes delivery.",
        status: "PENDING_REVIEW",
        startAt: this.offsetDays(now, 2),
        endAt: this.offsetDays(now, 16),
        submittedAt: this.offsetDays(now, -1),
        reviewedAt: null,
        rejectionReason: null,
        publishedAt: null,
        suspendedAt: null,
        suspensionReason: null,
        isSearchable: true,
        benefit: {
          benefitType: "FIXED_AMOUNT",
          percentageValue: null,
          fixedAmount: "20000.00",
          maxDiscountAmount: null,
          currency: "SYP",
          description: "حسم ثابت على السلة الأسبوعية",
          descriptionEn: "Flat discount on the weekly basket",
        },
        limits: {
          totalClaimLimit: 500,
          perUserClaimLimit: 1,
          maxRedemptionsPerCoupon: 1,
          budgetAmount: "10000000.00",
          currency: "SYP",
        },
        customSources: [
          {
            sourceType: "FACEBOOK",
            label: "إعلان الحي على فيسبوك",
            labelEn: "Neighborhood Facebook Ad",
            trackingToken: "fb-shahbaa-weekly",
            status: "ACTIVE",
          },
        ],
      },
      {
        businessSlug: "mobile-zone-damascus",
        categorySlug: "electronics-and-mobile",
        branchSlug: "bab-touma-branch",
        publicSlug: "mobile-zone-protection-kit",
        title: "حزمة حماية الموبايل",
        titleEn: "Mobile Protection Kit",
        description:
          "عرض يشمل واقي شاشة وغطاء حماية مع خدمة تركيب مجانية داخل المتجر.",
        descriptionEn:
          "Bundle including a screen protector and phone case with free in-store installation.",
        imageUrl:
          "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80",
        termsText:
          "تم رفض الحملة لحين تعديل صور المنتج وتوضيح الأنواع المشمولة في العرض.",
        termsTextEn:
          "Campaign was rejected pending improved product imagery and clearer included-device coverage.",
        status: "REJECTED",
        startAt: this.offsetDays(now, 4),
        endAt: this.offsetDays(now, 24),
        submittedAt: this.offsetDays(now, -5),
        reviewedAt: this.offsetDays(now, -4),
        rejectionReason:
          "يرجى توضيح الموديلات المشمولة وإضافة صور أصلية للمنتجات.",
        publishedAt: null,
        suspendedAt: null,
        suspensionReason: null,
        isSearchable: false,
        benefit: {
          benefitType: "PERCENTAGE",
          percentageValue: "18.00",
          fixedAmount: null,
          maxDiscountAmount: "30000.00",
          currency: "SYP",
          description: "حسم على ملحقات الحماية المختارة",
          descriptionEn: "Discount on selected protection accessories",
        },
        limits: {
          totalClaimLimit: 150,
          perUserClaimLimit: 1,
          maxRedemptionsPerCoupon: 1,
          budgetAmount: "2250000.00",
          currency: "SYP",
        },
        customSources: [
          {
            sourceType: "INSTAGRAM",
            label: "انستغرام المحل",
            labelEn: "Store Instagram",
            trackingToken: "ig-mobile-protect",
            status: "ACTIVE",
          },
        ],
      },
      {
        businessSlug: "old-gate-coffee",
        categorySlug: "specialty-coffee",
        branchSlug: "mazzeh-branch",
        publicSlug: "old-gate-winter-beans",
        title: "أسبوع القهوة الشتوية",
        titleEn: "Winter Coffee Week",
        description:
          "حملة موسمية على البن المختص والمشروبات الساخنة انتهت مع نهاية الموسم الماضي.",
        descriptionEn:
          "A seasonal campaign for specialty beans and hot drinks that ended with the previous winter season.",
        imageUrl:
          "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=80",
        termsText:
          "انتهت صلاحية الحملة. تستخدم البيانات لأغراض العرض والاختبار فقط.",
        termsTextEn:
          "This campaign is expired. Seeded for demo and testing purposes only.",
        status: "EXPIRED",
        startAt: this.offsetDays(now, -30),
        endAt: this.offsetDays(now, -3),
        submittedAt: this.offsetDays(now, -36),
        reviewedAt: this.offsetDays(now, -35),
        rejectionReason: null,
        publishedAt: this.offsetDays(now, -35),
        suspendedAt: null,
        suspensionReason: null,
        isSearchable: true,
        benefit: {
          benefitType: "FIXED_AMOUNT",
          percentageValue: null,
          fixedAmount: "10000.00",
          maxDiscountAmount: null,
          currency: "SYP",
          description: "حسم على أكياس البن والمشروبات الساخنة",
          descriptionEn: "Flat discount on coffee bean bags and hot drinks",
        },
        limits: {
          totalClaimLimit: 220,
          perUserClaimLimit: 1,
          maxRedemptionsPerCoupon: 1,
          budgetAmount: "2200000.00",
          currency: "SYP",
        },
        customSources: [
          {
            sourceType: "OTHER",
            label: "لوحات داخل الفرع",
            labelEn: "In-Store Posters",
            trackingToken: "other-oldgate-winter",
            status: "INACTIVE",
          },
        ],
      },
    ];
  }

  private async seedCampaign(
    seed: DemoCampaignSeed,
    adminUserId: string,
  ): Promise<void> {
    const business = await this.businessesRepository.findOne({
      where: { slug: seed.businessSlug },
    });
    const category = await this.categoriesRepository.findOne({
      where: { slug: seed.categorySlug },
    });

    if (!business || !category) {
      this.logger.warn(
        `Skipping campaign seed ${seed.publicSlug} because business or category is missing`,
      );
      return;
    }

    const branch = await this.branchesRepository.findOne({
      where: { businessId: business.id, slug: seed.branchSlug },
    });
    const ownerMembership = await this.membershipsRepository.findOne({
      where: { businessId: business.id, role: "OWNER", status: "ACTIVE" },
      order: { createdAt: "ASC" },
    });

    if (!branch || !ownerMembership) {
      this.logger.warn(
        `Skipping campaign seed ${seed.publicSlug} because branch or owner membership is missing`,
      );
      return;
    }

    let campaign = await this.campaignsRepository.findOne({
      where: { publicSlug: seed.publicSlug },
    });

    if (!campaign) {
      campaign = await this.campaignsRepository.save(
        this.campaignsRepository.create({
          businessId: business.id,
          primaryCategoryId: category.id,
          createdByMembershipId: ownerMembership.id,
          submittedByMembershipId: seed.submittedAt ? ownerMembership.id : null,
          reviewedByUserId: seed.reviewedAt ? adminUserId : null,
          suspendedByUserId: seed.suspendedAt ? adminUserId : null,
          title: seed.title,
          titleEn: seed.titleEn,
          publicSlug: seed.publicSlug,
          description: seed.description,
          descriptionEn: seed.descriptionEn,
          imageUrl: seed.imageUrl,
          termsText: seed.termsText,
          termsTextEn: seed.termsTextEn,
          status: seed.status,
          startAt: seed.startAt,
          endAt: seed.endAt,
          isSearchable: seed.isSearchable,
          submittedAt: seed.submittedAt,
          reviewedAt: seed.reviewedAt,
          rejectionReason: seed.rejectionReason,
          publishedAt: seed.publishedAt,
          suspendedAt: seed.suspendedAt,
          suspensionReason: seed.suspensionReason,
        }),
      );
    }

    await this.ensureBenefit(campaign.id, seed);
    await this.ensureLimits(campaign.id, seed);
    await this.ensureBranchLink(campaign.id, business.id, branch.id);
    await this.ensureSystemSource(
      campaign.id,
      business.id,
      "DIRECT",
      "Direct",
      "Direct",
    );
    await this.ensureSystemSource(
      campaign.id,
      business.id,
      "COUPONHUB_SEARCH",
      "CouponHub Search",
      "CouponHub Search",
    );

    for (const source of seed.customSources) {
      await this.ensureCustomSource(
        campaign.id,
        business.id,
        ownerMembership.id,
        source,
      );
    }
  }

  private async ensureBenefit(
    campaignId: string,
    seed: DemoCampaignSeed,
  ): Promise<void> {
    const existing = await this.benefitsRepository.findOne({
      where: { campaignId },
    });

    if (existing) {
      return;
    }

    await this.benefitsRepository.save(
      this.benefitsRepository.create({
        campaignId,
        benefitType: seed.benefit.benefitType,
        percentageValue: seed.benefit.percentageValue,
        fixedAmount: seed.benefit.fixedAmount,
        maxDiscountAmount: seed.benefit.maxDiscountAmount,
        currency: seed.benefit.currency,
        description: seed.benefit.description,
        descriptionEn: seed.benefit.descriptionEn,
      }),
    );
  }

  private async ensureLimits(
    campaignId: string,
    seed: DemoCampaignSeed,
  ): Promise<void> {
    const existing = await this.limitsRepository.findOne({
      where: { campaignId },
    });

    if (existing) {
      return;
    }

    await this.limitsRepository.save(
      this.limitsRepository.create({
        campaignId,
        totalClaimLimit: seed.limits.totalClaimLimit,
        perUserClaimLimit: seed.limits.perUserClaimLimit,
        maxRedemptionsPerCoupon: seed.limits.maxRedemptionsPerCoupon,
        budgetAmount: seed.limits.budgetAmount,
        currency: seed.limits.currency,
        couponValidityType: "CAMPAIGN_END",
        couponValidityMinutes: null,
        couponAbsoluteExpiresAt: null,
      }),
    );
  }

  private async ensureBranchLink(
    campaignId: string,
    businessId: string,
    branchId: string,
  ): Promise<void> {
    const existing = await this.campaignBranchesRepository.findOne({
      where: { campaignId, branchId, businessId },
    });

    if (existing) {
      return;
    }

    await this.campaignBranchesRepository.save(
      this.campaignBranchesRepository.create({
        campaignId,
        branchId,
        businessId,
      }),
    );
  }

  private async ensureSystemSource(
    campaignId: string,
    businessId: string,
    sourceType: string,
    label: string,
    labelEn: string,
  ): Promise<void> {
    const existing = await this.sourcesRepository.findOne({
      where: { campaignId, sourceType },
    });

    if (existing) {
      return;
    }

    await this.sourcesRepository.save(
      this.sourcesRepository.create({
        campaignId,
        businessId,
        createdByMembershipId: null,
        sourceType,
        label,
        labelEn,
        trackingToken:
          `${sourceType.toLowerCase()}-${campaignId.replace(/-/g, "")}`.slice(
            0,
            64,
          ),
        status: "ACTIVE",
        isSystemGenerated: true,
      }),
    );
  }

  private async ensureCustomSource(
    campaignId: string,
    businessId: string,
    createdByMembershipId: string,
    source: DemoCampaignSeed["customSources"][number],
  ): Promise<void> {
    const existing = await this.sourcesRepository.findOne({
      where: { campaignId, label: source.label },
    });

    if (existing) {
      return;
    }

    await this.sourcesRepository.save(
      this.sourcesRepository.create({
        campaignId,
        businessId,
        createdByMembershipId,
        sourceType: source.sourceType,
        label: source.label,
        labelEn: source.labelEn,
        trackingToken: source.trackingToken,
        status: source.status,
        isSystemGenerated: false,
      }),
    );
  }

  private offsetDays(base: Date, days: number): Date {
    const result = new Date(base);
    result.setDate(result.getDate() + days);
    return result;
  }
}
