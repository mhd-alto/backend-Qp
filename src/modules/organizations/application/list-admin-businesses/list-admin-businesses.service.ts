import { Injectable } from '@nestjs/common';
import { OrganizationReadRepository } from '../../infrastructure/persistence/typeorm/queries/organization-read.repository';

@Injectable()
export class ListAdminBusinessesService {
  constructor(
    private readonly organizationReadRepository: OrganizationReadRepository,
  ) {}

  async execute(status: string | undefined, page: number, limit: number) {
    const result = await this.organizationReadRepository.listBusinesses(
      status,
      page,
      limit,
    );

    return {
      items: result.items.map((item) => ({
        id: item.id,
        displayName: item.displayName,
        displayNameEn: item.displayNameEn,
        slug: item.slug,
        logoUrl: item.logoUrl,
        phone: item.phone,
        status: item.status,
        primaryBranch: item.primaryBranch,
      })),
      meta: {
        page,
        limit,
        total: result.total,
        pageCount: Math.max(1, Math.ceil(result.total / limit)),
      },
    };
  }
}
