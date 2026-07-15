import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfileOrmEntity } from '../entities/user-profile.orm-entity';
import { UserOrmEntity } from '../entities/user.orm-entity';

type AdminUserSummaryModel = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  platformRole: string;
  status: string;
};

@Injectable()
export class AdminUserReadRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly usersRepository: Repository<UserOrmEntity>,
  ) {}

  async listUsers(
    status: string | undefined,
    q: string | undefined,
    role: string | undefined,
    page: number,
    limit: number,
  ): Promise<{ items: AdminUserSummaryModel[]; total: number }> {
    const query = this.usersRepository
      .createQueryBuilder('user')
      .leftJoin(UserProfileOrmEntity, 'profile', 'profile.user_id = user.id')
      .select([
        'user.id AS id',
        "coalesce(profile.full_name, '') AS full_name",
        'user.email AS email',
        'user.phone AS phone',
        'user.platform_role AS platform_role',
        'user.status AS status',
      ])
      .where('user.deleted_at IS NULL');

    if (status) {
      query.andWhere('user.status = :status', { status });
    }

    if (role) {
      query.andWhere('user.platform_role = :role', { role });
    }

    if (q) {
      query.andWhere(
        '(LOWER(profile.full_name) LIKE :q OR LOWER(user.email) LIKE :q OR LOWER(user.phone) LIKE :q)',
        { q: `%${q.toLowerCase()}%` }
      );
    }

    const total = await query.getCount();

    const rows = await query
      .orderBy('user.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getRawMany<{
        id: string;
        full_name: string;
        email: string | null;
        phone: string | null;
        platform_role: string;
        status: string;
      }>();

    return {
      items: rows.map((row) => ({
        id: row.id,
        fullName: row.full_name,
        email: row.email,
        phone: row.phone,
        platformRole: row.platform_role,
        status: row.status,
      })),
      total,
    };
  }
}
