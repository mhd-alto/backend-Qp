import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { normalizeEmail } from '../../../../common/utilities/normalize-email';
import { normalizePhone } from '../../../../common/utilities/normalize-phone';
import {
  PASSWORD_HASHER,
  PasswordHasher,
} from '../../../auth/domain/services/password-hasher';
import {
  USER_PROFILE_REPOSITORY,
  UserProfileRepository,
} from '../../../identity/domain/repositories/user-profile.repository';
import {
  USER_REPOSITORY,
  UserRepository,
  UserRecord,
} from '../../../identity/domain/repositories/user.repository';
import { CategoryOrmEntity } from '../../../reference-data/infrastructure/persistence/typeorm/entities/category.orm-entity';
import { LocationOrmEntity } from '../../../reference-data/infrastructure/persistence/typeorm/entities/location.orm-entity';
import { BranchOrmEntity } from '../../infrastructure/persistence/typeorm/entities/branch.orm-entity';
import { BusinessCategoryOrmEntity } from '../../infrastructure/persistence/typeorm/entities/business-category.orm-entity';
import { BusinessMembershipOrmEntity } from '../../infrastructure/persistence/typeorm/entities/business-membership.orm-entity';
import { BusinessOrmEntity } from '../../infrastructure/persistence/typeorm/entities/business.orm-entity';
import { MembershipBranchOrmEntity } from '../../infrastructure/persistence/typeorm/entities/membership-branch.orm-entity';

type DemoBusinessSeed = {
  displayName: string;
  slug: string;
  description: string;
  phone: string;
  email: string;
  categorySlug: string;
  areaSlug: string;
  branchName: string;
  branchSlug: string;
  addressLine: string;
  owner: {
    fullName: string;
    email: string;
    phone: string;
  };
  staff: Array<{
    fullName: string;
    email: string;
    phone: string;
  }>;
};

@Injectable()
export class DemoMarketSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DemoMarketSeedService.name);

  constructor(
    @InjectRepository(BusinessOrmEntity)
    private readonly businessesRepository: Repository<BusinessOrmEntity>,
    @InjectRepository(BusinessCategoryOrmEntity)
    private readonly businessCategoriesRepository: Repository<BusinessCategoryOrmEntity>,
    @InjectRepository(BranchOrmEntity)
    private readonly branchesRepository: Repository<BranchOrmEntity>,
    @InjectRepository(BusinessMembershipOrmEntity)
    private readonly membershipsRepository: Repository<BusinessMembershipOrmEntity>,
    @InjectRepository(MembershipBranchOrmEntity)
    private readonly membershipBranchesRepository: Repository<MembershipBranchOrmEntity>,
    @InjectRepository(CategoryOrmEntity)
    private readonly categoriesRepository: Repository<CategoryOrmEntity>,
    @InjectRepository(LocationOrmEntity)
    private readonly locationsRepository: Repository<LocationOrmEntity>,
    @Inject(USER_REPOSITORY)
    private readonly usersRepository: UserRepository,
    @Inject(USER_PROFILE_REPOSITORY)
    private readonly profilesRepository: UserProfileRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.ensureDemoMarket();
  }

  private async ensureDemoMarket(): Promise<void> {
    const demoBusinesses: DemoBusinessSeed[] = [
      {
        displayName: 'بيت الشام للمشاوي',
        slug: 'beit-al-sham-grills',
        description: 'مطعم دمشقي يقدم مشاوي ومقبلات شرقية وعروض غداء مناسبة للعائلات.',
        phone: '+963944110101',
        email: 'beit-al-sham@couponhub-demo.sy',
        categorySlug: 'grills-and-levantine-cuisine',
        areaSlug: 'abu-rummaneh',
        branchName: 'فرع أبو رمانة',
        branchSlug: 'abu-rummaneh-branch',
        addressLine: 'أبو رمانة، قرب ساحة الروضة، دمشق',
        owner: {
          fullName: 'سامر الخطيب',
          email: 'samer.khateeb@couponhub-demo.sy',
          phone: '+963944110111',
        },
        staff: [
          {
            fullName: 'وسيم المصري',
            email: 'waseem.masri@couponhub-demo.sy',
            phone: '+963944110112',
          },
        ],
      },
      {
        displayName: 'حلويات الياسمين الدمشقية',
        slug: 'yasmin-damascene-sweets',
        description: 'محل حلويات شامية وبقلاوة ومعمول مع عروض موسمية على علب الضيافة.',
        phone: '+963944220201',
        email: 'yasmin-sweets@couponhub-demo.sy',
        categorySlug: 'damascene-sweets',
        areaSlug: 'shaalan',
        branchName: 'فرع الشعلان',
        branchSlug: 'shaalan-branch',
        addressLine: 'الشعلان، جانب شارع العابد، دمشق',
        owner: {
          fullName: 'رنا الحلاق',
          email: 'rana.hallaq@couponhub-demo.sy',
          phone: '+963944220211',
        },
        staff: [
          {
            fullName: 'جود أبو الخير',
            email: 'joud.abulkhair@couponhub-demo.sy',
            phone: '+963944220212',
          },
        ],
      },
      {
        displayName: 'قهوة البوابة القديمة',
        slug: 'old-gate-coffee',
        description: 'مقهى عصري يقدم قهوة مختصة ومشروبات باردة وحلويات خفيفة في قلب دمشق.',
        phone: '+963944330301',
        email: 'old-gate-coffee@couponhub-demo.sy',
        categorySlug: 'specialty-coffee',
        areaSlug: 'al-mazzeh',
        branchName: 'فرع المزة',
        branchSlug: 'mazzeh-branch',
        addressLine: 'المزة، أوتستراد المزة، قرب الجلاء، دمشق',
        owner: {
          fullName: 'نورس حمود',
          email: 'nawras.hmoud@couponhub-demo.sy',
          phone: '+963944330311',
        },
        staff: [
          {
            fullName: 'آية ناصر',
            email: 'aya.naser@couponhub-demo.sy',
            phone: '+963944330312',
          },
        ],
      },
      {
        displayName: 'صيدلية الشفاء الحديثة',
        slug: 'al-shifa-pharmacy',
        description: 'صيدلية مجتمعية تقدم أدوية أساسية ومنتجات عناية مع خصومات على المستلزمات المنزلية.',
        phone: '+963944440401',
        email: 'al-shifa-pharmacy@couponhub-demo.sy',
        categorySlug: 'pharmacies',
        areaSlug: 'kafr-souseh',
        branchName: 'فرع كفرسوسة',
        branchSlug: 'kafr-souseh-branch',
        addressLine: 'كفرسوسة، قرب دوار الجمارك، دمشق',
        owner: {
          fullName: 'رامي درويش',
          email: 'rami.darwish@couponhub-demo.sy',
          phone: '+963944440411',
        },
        staff: [
          {
            fullName: 'نور سعيد',
            email: 'noor.saeed@couponhub-demo.sy',
            phone: '+963944440412',
          },
        ],
      },
      {
        displayName: 'سوبر ماركت الشهباء',
        slug: 'shahbaa-market',
        description: 'سوبر ماركت محلي بعروض على المواد الغذائية والمنظفات والمنتجات اليومية.',
        phone: '+963944550501',
        email: 'shahbaa-market@couponhub-demo.sy',
        categorySlug: 'supermarkets',
        areaSlug: 'al-midan',
        branchName: 'فرع الميدان',
        branchSlug: 'midan-branch',
        addressLine: 'الميدان، شارع الأمير عبد القادر، دمشق',
        owner: {
          fullName: 'أحمد ديب',
          email: 'ahmad.deeb@couponhub-demo.sy',
          phone: '+963944550511',
        },
        staff: [
          {
            fullName: 'ليان قدسي',
            email: 'layan.qudsi@couponhub-demo.sy',
            phone: '+963944550512',
          },
        ],
      },
      {
        displayName: 'موبايل زون دمشق',
        slug: 'mobile-zone-damascus',
        description: 'متجر موبايلات واكسسوارات وصيانة سريعة مع عروض على السماعات والشواحن.',
        phone: '+963944660601',
        email: 'mobile-zone@couponhub-demo.sy',
        categorySlug: 'electronics-and-mobile',
        areaSlug: 'bab-touma',
        branchName: 'فرع باب توما',
        branchSlug: 'bab-touma-branch',
        addressLine: 'باب توما، قرب ساحة الباب، دمشق',
        owner: {
          fullName: 'طلال جرجس',
          email: 'talal.gerges@couponhub-demo.sy',
          phone: '+963944660611',
        },
        staff: [
          {
            fullName: 'كريستين معلوف',
            email: 'christine.mallouf@couponhub-demo.sy',
            phone: '+963944660612',
          },
        ],
      },
    ];

    for (const businessSeed of demoBusinesses) {
      await this.seedBusiness(businessSeed);
    }

    this.logger.log('Demo market seed checked');
  }

  private async seedBusiness(seed: DemoBusinessSeed): Promise<void> {
    const existingBusiness = await this.businessesRepository.findOne({
      where: { slug: seed.slug },
    });

    if (existingBusiness) {
      return;
    }

    const category = await this.categoriesRepository.findOne({
      where: { slug: seed.categorySlug },
    });
    const location = await this.locationsRepository.findOne({
      where: { slug: seed.areaSlug },
    });

    if (!category || !location) {
      return;
    }

    const ownerUser = await this.ensureUser(
      seed.owner.fullName,
      seed.owner.email,
      seed.owner.phone,
    );

    const business = await this.businessesRepository.save(
      this.businessesRepository.create({
        legalName: null,
        displayName: seed.displayName,
        displayNameEn: null,
        slug: seed.slug,
        description: seed.description,
        descriptionEn: null,
        logoUrl: null,
        coverUrl: null,
        email: normalizeEmail(seed.email),
        phone: normalizePhone(seed.phone) ?? seed.phone,
        status: 'ACTIVE',
        createdByUserId: ownerUser.id,
      }),
    );

    await this.businessCategoriesRepository.save(
      this.businessCategoriesRepository.create({
        businessId: business.id,
        categoryId: category.id,
        isPrimary: true,
      }),
    );

    const branch = await this.branchesRepository.save(
      this.branchesRepository.create({
        businessId: business.id,
        name: seed.branchName,
        nameEn: null,
        slug: seed.branchSlug,
        addressLine: seed.addressLine,
        addressLineEn: null,
        locationId: location.id,
        phone: normalizePhone(seed.phone) ?? seed.phone,
        isPrimary: true,
        status: 'ACTIVE',
      }),
    );

    const ownerMembership = await this.membershipsRepository.save(
      this.membershipsRepository.create({
        businessId: business.id,
        userId: ownerUser.id,
        role: 'OWNER',
        status: 'ACTIVE',
        invitedByUserId: null,
        joinedAt: new Date(),
      }),
    );

    await this.membershipBranchesRepository.save(
      this.membershipBranchesRepository.create({
        membershipId: ownerMembership.id,
        branchId: branch.id,
        businessId: business.id,
      }),
    );

    for (const staffMember of seed.staff) {
      const staffUser = await this.ensureUser(
        staffMember.fullName,
        staffMember.email,
        staffMember.phone,
      );

      const staffMembership = await this.membershipsRepository.save(
        this.membershipsRepository.create({
          businessId: business.id,
          userId: staffUser.id,
          role: 'STAFF',
          status: 'ACTIVE',
          invitedByUserId: ownerUser.id,
          joinedAt: new Date(),
        }),
      );

      await this.membershipBranchesRepository.save(
        this.membershipBranchesRepository.create({
          membershipId: staffMembership.id,
          branchId: branch.id,
          businessId: business.id,
        }),
      );
    }
  }

  private async ensureUser(
    fullName: string,
    email: string,
    phone: string,
  ): Promise<UserRecord> {
    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhone(phone);
    const existing = await this.usersRepository.findActiveByIdentifier({
      email: normalizedEmail,
      phone: normalizedPhone,
    });

    if (existing) {
      const profile = await this.profilesRepository.findByUserId(existing.id);

      if (!profile) {
        await this.profilesRepository.create({
          userId: existing.id,
          fullName,
        });
      }

      return existing;
    }

    const passwordHash = await this.passwordHasher.hash('SeedUser@123');
    const user = await this.usersRepository.create({
      email: normalizedEmail,
      phone: normalizedPhone,
      passwordHash,
      platformRole: 'USER',
      status: 'ACTIVE',
    });

    await this.profilesRepository.create({
      userId: user.id,
      fullName,
    });

    return user;
  }
}
