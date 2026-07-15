import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocationOrmEntity } from '../../../modules/reference-data/infrastructure/persistence/typeorm/entities/location.orm-entity';

@Injectable()
export class LocationsSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(LocationsSeedService.name);

  constructor(
    @InjectRepository(LocationOrmEntity)
    private readonly locationsRepository: Repository<LocationOrmEntity>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.ensureSeedData();
  }

  private async ensureSeedData(): Promise<void> {
    const country = await this.upsertLocation({
      parentId: null,
      type: 'COUNTRY',
      nameAr: 'سوريا',
      nameEn: 'Syria',
      slug: 'syria',
    });

    const damascusGovernorate = await this.upsertLocation({
      parentId: country.id,
      type: 'GOVERNORATE',
      nameAr: 'دمشق',
      nameEn: 'Damascus',
      slug: 'damascus',
    });

    const ruralDamascusGovernorate = await this.upsertLocation({
      parentId: country.id,
      type: 'GOVERNORATE',
      nameAr: 'ريف دمشق',
      nameEn: 'Rural Damascus',
      slug: 'rural-damascus',
    });

    await this.upsertLocation({
      parentId: country.id,
      type: 'GOVERNORATE',
      nameAr: 'حلب',
      nameEn: 'Aleppo',
      slug: 'aleppo',
    });
    await this.upsertLocation({
      parentId: country.id,
      type: 'GOVERNORATE',
      nameAr: 'حمص',
      nameEn: 'Homs',
      slug: 'homs',
    });
    await this.upsertLocation({
      parentId: country.id,
      type: 'GOVERNORATE',
      nameAr: 'اللاذقية',
      nameEn: 'Latakia',
      slug: 'latakia',
    });
    await this.upsertLocation({
      parentId: country.id,
      type: 'GOVERNORATE',
      nameAr: 'طرطوس',
      nameEn: 'Tartus',
      slug: 'tartus',
    });

    const damascusCity = await this.upsertLocation({
      parentId: damascusGovernorate.id,
      type: 'CITY',
      nameAr: 'مدينة دمشق',
      nameEn: 'Damascus City',
      slug: 'damascus-city',
    });

    await this.upsertLocation({
      parentId: ruralDamascusGovernorate.id,
      type: 'CITY',
      nameAr: 'جرمانا',
      nameEn: 'Jaramana',
      slug: 'jaramana',
    });
    await this.upsertLocation({
      parentId: ruralDamascusGovernorate.id,
      type: 'CITY',
      nameAr: 'صحنايا',
      nameEn: 'Sahnaya',
      slug: 'sahnaya',
    });

    const damascusAreas = [
      { nameAr: 'أبو رمانة', nameEn: 'Abu Rummaneh', slug: 'abu-rummaneh' },
      { nameAr: 'المزة', nameEn: 'Al Mazzeh', slug: 'al-mazzeh' },
      { nameAr: 'الشعلان', nameEn: 'Shaalan', slug: 'shaalan' },
      { nameAr: 'كفرسوسة', nameEn: 'Kafr Souseh', slug: 'kafr-souseh' },
      { nameAr: 'الميدان', nameEn: 'Al Midan', slug: 'al-midan' },
      { nameAr: 'المالكي', nameEn: 'Al Maliki', slug: 'al-maliki' },
      { nameAr: 'باب توما', nameEn: 'Bab Touma', slug: 'bab-touma' },
      { nameAr: 'المهاجرين', nameEn: 'Muhajreen', slug: 'muhajreen' },
    ];

    for (const area of damascusAreas) {
      await this.upsertLocation({
        parentId: damascusCity.id,
        type: 'AREA',
        ...area,
      });
    }

    this.logger.log('Reference locations seed checked');
  }

  private async upsertLocation(input: {
    parentId: string | null;
    type: string;
    nameAr: string;
    nameEn: string;
    slug: string;
  }): Promise<LocationOrmEntity> {
    const existing = await this.findBySlugAndParent(input.slug, input.parentId);

    if (existing) {
      return existing;
    }

    return this.locationsRepository.save(
      this.locationsRepository.create({
        ...input,
        status: 'ACTIVE',
      }),
    );
  }

  private async findBySlugAndParent(
    slug: string,
    parentId: string | null,
  ): Promise<LocationOrmEntity | null> {
    const query = this.locationsRepository
      .createQueryBuilder('location')
      .where('location.slug = :slug', { slug });

    if (parentId === null) {
      query.andWhere('location.parent_id IS NULL');
    } else {
      query.andWhere('location.parent_id = :parentId', { parentId });
    }

    return query.getOne();
  }
}
