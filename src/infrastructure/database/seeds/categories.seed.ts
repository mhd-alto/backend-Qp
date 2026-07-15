import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryOrmEntity } from '../../../modules/reference-data/infrastructure/persistence/typeorm/entities/category.orm-entity';

@Injectable()
export class CategoriesSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CategoriesSeedService.name);

  constructor(
    @InjectRepository(CategoryOrmEntity)
    private readonly categoriesRepository: Repository<CategoryOrmEntity>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.ensureSeedData();
  }

  private async ensureSeedData(): Promise<void> {
    const restaurants = await this.upsertCategory({
      parentId: null,
      nameAr: 'مطاعم',
      nameEn: 'Restaurants',
      slug: 'restaurants',
      iconUrl: null,
      sortOrder: 10,
    });
    const sweets = await this.upsertCategory({
      parentId: null,
      nameAr: 'حلويات',
      nameEn: 'Sweets',
      slug: 'sweets',
      iconUrl: null,
      sortOrder: 20,
    });
    const cafes = await this.upsertCategory({
      parentId: null,
      nameAr: 'قهوة ومشروبات',
      nameEn: 'Coffee and Beverages',
      slug: 'coffee-and-beverages',
      iconUrl: null,
      sortOrder: 30,
    });

    const roots = [
      {
        parentId: null,
        nameAr: 'صيدليات',
        nameEn: 'Pharmacies',
        slug: 'pharmacies',
        sortOrder: 40,
      },
      {
        parentId: null,
        nameAr: 'سوبرماركت',
        nameEn: 'Supermarkets',
        slug: 'supermarkets',
        sortOrder: 50,
      },
      {
        parentId: null,
        nameAr: 'ألبسة وأحذية',
        nameEn: 'Fashion and Shoes',
        slug: 'fashion-and-shoes',
        sortOrder: 60,
      },
      {
        parentId: null,
        nameAr: 'إلكترونيات وموبايلات',
        nameEn: 'Electronics and Mobile',
        slug: 'electronics-and-mobile',
        sortOrder: 70,
      },
      {
        parentId: null,
        nameAr: 'تجميل وعناية',
        nameEn: 'Beauty and Personal Care',
        slug: 'beauty-and-personal-care',
        sortOrder: 80,
      },
      {
        parentId: null,
        nameAr: 'مكتبات وقرطاسية',
        nameEn: 'Books and Stationery',
        slug: 'books-and-stationery',
        sortOrder: 90,
      },
      {
        parentId: null,
        nameAr: 'منزل ومطبخ',
        nameEn: 'Home and Kitchen',
        slug: 'home-and-kitchen',
        sortOrder: 100,
      },
    ];

    for (const root of roots) {
      await this.upsertCategory({
        ...root,
        iconUrl: null,
      });
    }

    const children = [
      {
        parentId: restaurants.id,
        nameAr: 'مشاوي ومطابخ شرقية',
        nameEn: 'Grills and Levantine Cuisine',
        slug: 'grills-and-levantine-cuisine',
        sortOrder: 11,
      },
      {
        parentId: restaurants.id,
        nameAr: 'شاورما ووجبات سريعة',
        nameEn: 'Shawarma and Fast Food',
        slug: 'shawarma-and-fast-food',
        sortOrder: 12,
      },
      {
        parentId: restaurants.id,
        nameAr: 'بيتزا ومعجنات',
        nameEn: 'Pizza and Baked Meals',
        slug: 'pizza-and-baked-meals',
        sortOrder: 13,
      },
      {
        parentId: sweets.id,
        nameAr: 'حلويات شامية',
        nameEn: 'Damascene Sweets',
        slug: 'damascene-sweets',
        sortOrder: 21,
      },
      {
        parentId: sweets.id,
        nameAr: 'بوظة ومثلجات',
        nameEn: 'Ice Cream and Gelato',
        slug: 'ice-cream-and-gelato',
        sortOrder: 22,
      },
      {
        parentId: cafes.id,
        nameAr: 'قهوة مختصة',
        nameEn: 'Specialty Coffee',
        slug: 'specialty-coffee',
        sortOrder: 31,
      },
      {
        parentId: cafes.id,
        nameAr: 'عصائر ومشروبات باردة',
        nameEn: 'Juices and Cold Drinks',
        slug: 'juices-and-cold-drinks',
        sortOrder: 32,
      },
    ];

    for (const child of children) {
      await this.upsertCategory({
        ...child,
        iconUrl: null,
      });
    }

    this.logger.log('Reference categories seed checked');
  }

  private async upsertCategory(input: {
    parentId: string | null;
    nameAr: string;
    nameEn: string | null;
    slug: string;
    iconUrl: string | null;
    sortOrder: number;
  }): Promise<CategoryOrmEntity> {
    const existing = await this.categoriesRepository.findOne({
      where: { slug: input.slug },
    });

    if (existing) {
      return existing;
    }

    return this.categoriesRepository.save(
      this.categoriesRepository.create({
        ...input,
        status: 'ACTIVE',
      }),
    );
  }
}
