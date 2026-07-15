import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { IdentityModule } from '../identity/identity.module';
import { AdminCategoriesController } from './api/admin-categories.controller';
import { PublicCategoriesController } from './api/public-categories.controller';
import { ChangeCategoryStatusService } from './application/change-category-status/change-category-status.service';
import { CreateCategoryService } from './application/create-category/create-category.service';
import { ListActiveCategoriesService } from './application/list-active-categories/list-active-categories.service';
import { ListAdminCategoriesService } from './application/list-admin-categories/list-admin-categories.service';
import { CATEGORY_READER } from './contracts/category-reader';
import { LOCATION_READER } from './contracts/location-reader';
import { CATEGORY_REPOSITORY } from './domain/repositories/category.repository';
import { CategoryOrmEntity } from './infrastructure/persistence/typeorm/entities/category.orm-entity';
import { LocationOrmEntity } from './infrastructure/persistence/typeorm/entities/location.orm-entity';
import { LocationReadRepository } from './infrastructure/persistence/typeorm/queries/location-read.repository';
import { TypeOrmCategoryRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-category.repository';
import { UpdateCategoryService } from './application/update-category/update-category.service';
import { CategoriesSeedService } from '../../infrastructure/database/seeds/categories.seed';
import { LocationsSeedService } from '../../infrastructure/database/seeds/locations.seed';

@Module({
  imports: [
    AuditModule,
    AuthModule,
    IdentityModule,
    TypeOrmModule.forFeature([CategoryOrmEntity, LocationOrmEntity]),
  ],
  controllers: [PublicCategoriesController, AdminCategoriesController],
  providers: [
    ListActiveCategoriesService,
    ListAdminCategoriesService,
    CreateCategoryService,
    UpdateCategoryService,
    ChangeCategoryStatusService,
    LocationsSeedService,
    CategoriesSeedService,
    LocationReadRepository,
    TypeOrmCategoryRepository,
    {
      provide: CATEGORY_REPOSITORY,
      useExisting: TypeOrmCategoryRepository,
    },
    {
      provide: CATEGORY_READER,
      useExisting: ListActiveCategoriesService,
    },
    {
      provide: LOCATION_READER,
      useExisting: LocationReadRepository,
    },
  ],
  exports: [CATEGORY_READER, CATEGORY_REPOSITORY, LOCATION_READER],
})
export class ReferenceDataModule {}
