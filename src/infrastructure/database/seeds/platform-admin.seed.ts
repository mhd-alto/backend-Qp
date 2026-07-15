import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import {
  PASSWORD_HASHER,
  PasswordHasher,
} from '../../../modules/auth/domain/services/password-hasher';
import {
  USER_PROFILE_REPOSITORY,
  UserProfileRepository,
} from '../../../modules/identity/domain/repositories/user-profile.repository';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../../modules/identity/domain/repositories/user.repository';
import { normalizeEmail } from '../../../common/utilities/normalize-email';

@Injectable()
export class PlatformAdminSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PlatformAdminSeedService.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly usersRepository: UserRepository,
    @Inject(USER_PROFILE_REPOSITORY)
    private readonly profilesRepository: UserProfileRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.ensurePlatformAdmin();
  }

  private async ensurePlatformAdmin(): Promise<void> {
    const email = normalizeEmail('admin@couponhub-demo.sy');
    const existing = await this.usersRepository.findActiveByIdentifier({ email });

    if (existing) {
      const profile = await this.profilesRepository.findByUserId(existing.id);

      if (!profile) {
        await this.profilesRepository.create({
          userId: existing.id,
          fullName: 'مدير منصة CouponHub',
        });
      }

      return;
    }

    const passwordHash = await this.passwordHasher.hash('Admin@12345');
    const user = await this.usersRepository.create({
      email,
      phone: null,
      passwordHash,
      platformRole: 'ADMIN',
      status: 'ACTIVE',
    });

    await this.profilesRepository.create({
      userId: user.id,
      fullName: 'مدير منصة CouponHub',
    });

    this.logger.log('Platform admin seed created: admin@couponhub-demo.sy');
  }
}
