import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CategoryOrmEntity } from '../../../../../reference-data/infrastructure/persistence/typeorm/entities/category.orm-entity';
import { UserOrmEntity } from '../../../../../identity/infrastructure/persistence/typeorm/entities/user.orm-entity';
import { UserProfileOrmEntity } from '../../../../../identity/infrastructure/persistence/typeorm/entities/user-profile.orm-entity';
import { BranchOrmEntity } from '../entities/branch.orm-entity';
import { BusinessCategoryOrmEntity } from '../entities/business-category.orm-entity';
import { BusinessMembershipOrmEntity } from '../entities/business-membership.orm-entity';
import { BusinessOrmEntity } from '../entities/business.orm-entity';

type BusinessDetailsModel = {
  id: string;
  legalName: string | null;
  displayName: string;
  displayNameEn: string | null;
  slug: string;
  logoUrl: string | null;
  phone: string;
  status: string;
  description: string | null;
  descriptionEn: string | null;
  email: string | null;
  primaryBranch: {
    id: string;
    name: string;
    nameEn: string | null;
    addressLine: string;
    addressLineEn: string | null;
    phone: string | null;
  };
  primaryCategory: {
    id: string;
    nameAr: string;
    nameEn: string | null;
    slug: string;
    status: string;
  };
  members: Array<{
    membershipId: string;
    user: {
      id: string;
      fullName: string;
      email: string | null;
      phone: string | null;
      platformRole: string;
      status: string;
    };
    role: string;
    status: string;
  }>;
};

@Injectable()
export class OrganizationReadRepository {
  constructor(
    @InjectRepository(BusinessOrmEntity)
    private readonly businessesRepository: Repository<BusinessOrmEntity>,
    @InjectRepository(BranchOrmEntity)
    private readonly branchesRepository: Repository<BranchOrmEntity>,
    @InjectRepository(BusinessCategoryOrmEntity)
    private readonly businessCategoriesRepository: Repository<BusinessCategoryOrmEntity>,
    @InjectRepository(CategoryOrmEntity)
    private readonly categoriesRepository: Repository<CategoryOrmEntity>,
    @InjectRepository(BusinessMembershipOrmEntity)
    private readonly membershipsRepository: Repository<BusinessMembershipOrmEntity>,
    @InjectRepository(UserOrmEntity)
    private readonly usersRepository: Repository<UserOrmEntity>,
    @InjectRepository(UserProfileOrmEntity)
    private readonly profilesRepository: Repository<UserProfileOrmEntity>,
  ) {}

  async listBusinesses(
    status: string | undefined,
    page: number,
    limit: number,
  ): Promise<{ items: BusinessDetailsModel[]; total: number }> {
    const query = this.businessesRepository
      .createQueryBuilder('business')
      .where('business.deleted_at IS NULL')
      .orderBy('business.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) {
      query.andWhere('business.status = :status', { status });
    }

    const [businesses, total] = await query.getManyAndCount();

    const items = await Promise.all(
      businesses.map((business) => this.getBusinessDetails(business.id)),
    );

    return {
      items: items.filter((item): item is BusinessDetailsModel => item !== null),
      total,
    };
  }

  async getBusinessDetails(businessId: string): Promise<BusinessDetailsModel | null> {
    const business = await this.businessesRepository
      .createQueryBuilder('business')
      .where('business.id = :businessId', { businessId })
      .andWhere('business.deleted_at IS NULL')
      .getOne();

    if (!business) {
      return null;
    }

    const primaryBranch = await this.branchesRepository
      .createQueryBuilder('branch')
      .where('branch.business_id = :businessId', { businessId })
      .andWhere('branch.is_primary = true')
      .andWhere('branch.deleted_at IS NULL')
      .getOne();
    const primaryCategoryLink = await this.businessCategoriesRepository.findOne({
      where: { businessId, isPrimary: true },
    });
    const primaryCategory = primaryCategoryLink
      ? await this.categoriesRepository.findOne({
          where: { id: primaryCategoryLink.categoryId },
        })
      : null;
    const memberships = await this.membershipsRepository.find({
      where: { businessId },
      order: { createdAt: 'ASC' },
    });

    const userIds = memberships.map((membership) => membership.userId);
    const users = userIds.length
      ? await this.usersRepository.find({ where: { id: In(userIds) } })
      : [];
    const profiles = userIds.length
      ? await this.profilesRepository.find({ where: { userId: In(userIds) } })
      : [];

    if (!primaryBranch || !primaryCategory) {
      return null;
    }

    return {
      id: business.id,
      legalName: business.legalName,
      displayName: business.displayName,
      displayNameEn: business.displayNameEn,
      slug: business.slug,
      logoUrl: business.logoUrl,
      phone: business.phone,
      status: business.status,
      description: business.description,
      descriptionEn: business.descriptionEn,
      email: business.email,
      primaryBranch: {
        id: primaryBranch.id,
        name: primaryBranch.name,
        nameEn: primaryBranch.nameEn,
        addressLine: primaryBranch.addressLine,
        addressLineEn: primaryBranch.addressLineEn,
        phone: primaryBranch.phone,
      },
      primaryCategory: {
        id: primaryCategory.id,
        nameAr: primaryCategory.nameAr,
        nameEn: primaryCategory.nameEn,
        slug: primaryCategory.slug,
        status: primaryCategory.status,
      },
      members: memberships.map((membership) => {
        const user = users.find((item) => item.id === membership.userId);
        const profile = profiles.find((item) => item.userId === membership.userId);

        return {
          membershipId: membership.id,
          user: {
            id: membership.userId,
            fullName: profile?.fullName ?? '',
            email: user?.email ?? null,
            phone: user?.phone ?? null,
            platformRole: user?.platformRole ?? 'USER',
            status: user?.status ?? 'ACTIVE',
          },
          role: membership.role,
          status: membership.status,
        };
      }),
    };
  }
}
