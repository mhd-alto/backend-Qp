import { Injectable } from '@nestjs/common';
import { AdminUserPageResponseDto } from '../../api/dto/admin-user-page.response';
import { ListAdminUsersQueryDto } from '../../api/dto/list-admin-users.query';
import { AdminUserReadRepository } from '../../infrastructure/persistence/typeorm/queries/admin-user-read.repository';

@Injectable()
export class ListAdminUsersService {
  constructor(
    private readonly adminUserReadRepository: AdminUserReadRepository,
  ) {}

  async execute(
    query: ListAdminUsersQueryDto,
  ): Promise<AdminUserPageResponseDto> {
    const result = await this.adminUserReadRepository.listUsers(
      query.status,
      query.q,
      query.role,
      query.page,
      query.limit,
    );

    return {
      items: result.items,
      meta: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        pageCount: Math.max(1, Math.ceil(result.total / query.limit)),
      },
    };
  }
}
