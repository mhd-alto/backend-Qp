import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedPrincipal } from '../../../../common/types/authenticated-principal';
import { AUDIT_WRITER } from '../../../audit/contracts/audit.tokens';
import { AuditWriter } from '../../../audit/contracts/audit-writer';
import { FRIENDLY_MESSAGES } from '../../../../common/constants/localized-messages';
import { CategoryStatusRequestDto } from '../../api/dto/category-status.request';
import { Category } from '../../domain/entities/category';
import {
  CATEGORY_REPOSITORY,
  CategoryRepository,
} from '../../domain/repositories/category.repository';

@Injectable()
export class ChangeCategoryStatusService {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: CategoryRepository,
    @Inject(AUDIT_WRITER)
    private readonly auditWriter: AuditWriter,
  ) {}

  async execute(
    categoryId: string,
    input: CategoryStatusRequestDto,
    actor: AuthenticatedPrincipal,
  ): Promise<Category> {
    const existing = await this.categoryRepository.findById(categoryId);

    if (!existing) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: FRIENDLY_MESSAGES.RESOURCE_NOT_FOUND,
      });
    }

    const category = await this.categoryRepository.update(categoryId, {
      status: input.status,
    });

    await this.auditWriter.write({
      actorUserId: actor.id,
      businessId: null,
      action: 'CATEGORY_STATUS_CHANGED',
      entityType: 'CATEGORY',
      entityId: category.id,
      metadata: {
        status: category.status,
      },
    });

    return category;
  }
}
