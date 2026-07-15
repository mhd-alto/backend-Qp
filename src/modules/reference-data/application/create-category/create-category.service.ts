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
import { CreateCategoryRequestDto } from '../../api/dto/create-category.request';
import { Category } from '../../domain/entities/category';
import {
  CATEGORY_REPOSITORY,
  CategoryRepository,
} from '../../domain/repositories/category.repository';

@Injectable()
export class CreateCategoryService {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: CategoryRepository,
    @Inject(AUDIT_WRITER)
    private readonly auditWriter: AuditWriter,
  ) {}

  async execute(
    input: CreateCategoryRequestDto,
    actor: AuthenticatedPrincipal,
  ): Promise<Category> {
    const nameAr = input.nameAr.trim();
    const slug = input.slug.trim();
    const parentId = input.parentId ?? null;

    if (parentId) {
      const parent = await this.categoryRepository.findById(parentId);

      if (!parent) {
        throw new NotFoundException({
          code: 'RESOURCE_NOT_FOUND',
          message: FRIENDLY_MESSAGES.RESOURCE_NOT_FOUND,
        });
      }
    }

    await this.ensureNoSlugConflict(slug);
    await this.ensureNoSiblingNameConflict(parentId, nameAr);

    const category = await this.categoryRepository.create({
      parentId,
      nameAr,
      nameEn: input.nameEn?.trim() ?? null,
      slug,
      iconUrl: input.iconUrl?.trim() ?? null,
      sortOrder: input.sortOrder ?? 0,
    });

    await this.auditWriter.write({
      actorUserId: actor.id,
      businessId: null,
      action: 'CATEGORY_CREATED',
      entityType: 'CATEGORY',
      entityId: category.id,
      metadata: {
        slug: category.slug,
        parentId: category.parentId,
        status: category.status,
      },
    });

    return category;
  }

  private async ensureNoSlugConflict(slug: string): Promise<void> {
    const existing = await this.categoryRepository.findBySlug(slug);

    if (existing) {
      throw new ConflictException({
        code: 'IDENTIFIER_ALREADY_IN_USE',
        message: {
          ar: 'هذا الرابط المختصر للتصنيف مستخدم بالفعل.',
          en: 'This category slug is already in use.',
        },
      });
    }
  }

  private async ensureNoSiblingNameConflict(
    parentId: string | null,
    nameAr: string,
  ): Promise<void> {
    const existing = await this.categoryRepository.findByParentAndNameAr(parentId, nameAr);

    if (existing) {
      throw new ConflictException({
        code: 'IDENTIFIER_ALREADY_IN_USE',
        message: {
          ar: 'اسم التصنيف العربي موجود بالفعل ضمن نفس المستوى.',
          en: 'This Arabic category name already exists at the same level.',
        },
      });
    }
  }
}
