import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedPrincipal } from '../../../../common/types/authenticated-principal';
import { AUDIT_WRITER } from '../../../audit/contracts/audit.tokens';
import { AuditWriter } from '../../../audit/contracts/audit-writer';
import { FRIENDLY_MESSAGES } from '../../../../common/constants/localized-messages';
import { UpdateCategoryRequestDto } from '../../api/dto/update-category.request';
import { Category } from '../../domain/entities/category';
import {
  CATEGORY_REPOSITORY,
  CategoryRepository,
  UpdateCategoryInput,
} from '../../domain/repositories/category.repository';

@Injectable()
export class UpdateCategoryService {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: CategoryRepository,
    @Inject(AUDIT_WRITER)
    private readonly auditWriter: AuditWriter,
  ) {}

  async execute(
    categoryId: string,
    input: UpdateCategoryRequestDto,
    actor: AuthenticatedPrincipal,
  ): Promise<Category> {
    const existing = await this.categoryRepository.findById(categoryId);

    if (!existing) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: FRIENDLY_MESSAGES.RESOURCE_NOT_FOUND,
      });
    }

    const patch: UpdateCategoryInput = {};

    if (Object.prototype.hasOwnProperty.call(input, 'parentId')) {
      const parentId = input.parentId ?? null;

      if (parentId === categoryId) {
        throw new ConflictException({
          code: 'REQUEST_FAILED',
          message: {
            ar: 'لا يمكن أن يكون التصنيف ابناً لنفسه.',
            en: 'A category cannot be its own parent.',
          },
        });
      }

      if (parentId) {
        const parent = await this.categoryRepository.findById(parentId);

        if (!parent) {
          throw new NotFoundException({
            code: 'RESOURCE_NOT_FOUND',
            message: FRIENDLY_MESSAGES.RESOURCE_NOT_FOUND,
          });
        }

        await this.ensureNoCycle(categoryId, parentId);
      }

      patch.parentId = parentId;
    }

    if (typeof input.slug === 'string') {
      const slug = input.slug.trim();
      const duplicate = await this.categoryRepository.findBySlug(slug);

      if (duplicate && duplicate.id !== categoryId) {
        throw new ConflictException({
          code: 'IDENTIFIER_ALREADY_IN_USE',
          message: {
            ar: 'هذا الرابط المختصر للتصنيف مستخدم بالفعل.',
            en: 'This category slug is already in use.',
          },
        });
      }

      patch.slug = slug;
    }

    if (typeof input.nameAr === 'string') {
      const nameAr = input.nameAr.trim();
      const parentId =
        Object.prototype.hasOwnProperty.call(patch, 'parentId') ? patch.parentId! : existing.parentId;
      const duplicate = await this.categoryRepository.findByParentAndNameAr(
        parentId,
        nameAr,
        categoryId,
      );

      if (duplicate) {
        throw new ConflictException({
          code: 'IDENTIFIER_ALREADY_IN_USE',
          message: {
            ar: 'اسم التصنيف العربي موجود بالفعل ضمن نفس المستوى.',
            en: 'This Arabic category name already exists at the same level.',
          },
        });
      }

      patch.nameAr = nameAr;
    }

    if (Object.prototype.hasOwnProperty.call(input, 'nameEn')) {
      patch.nameEn = input.nameEn?.trim() ?? null;
    }

    if (Object.prototype.hasOwnProperty.call(input, 'iconUrl')) {
      patch.iconUrl = input.iconUrl?.trim() ?? null;
    }

    if (typeof input.sortOrder === 'number') {
      patch.sortOrder = input.sortOrder;
    }

    const category = await this.categoryRepository.update(categoryId, patch);

    await this.auditWriter.write({
      actorUserId: actor.id,
      businessId: null,
      action: 'CATEGORY_UPDATED',
      entityType: 'CATEGORY',
      entityId: category.id,
      metadata: {
        updatedFields: Object.keys(patch),
        slug: category.slug,
        parentId: category.parentId,
      },
    });

    return category;
  }

  private async ensureNoCycle(categoryId: string, parentId: string): Promise<void> {
    let currentParentId: string | null = parentId;

    while (currentParentId) {
      if (currentParentId === categoryId) {
        throw new ConflictException({
          code: 'REQUEST_FAILED',
          message: {
            ar: 'لا يمكن نقل التصنيف داخل أحد أبنائه.',
            en: 'A category cannot be moved under one of its descendants.',
          },
        });
      }

      const currentParent = await this.categoryRepository.findById(currentParentId);
      currentParentId = currentParent?.parentId ?? null;
    }
  }
}
