import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import {
  PASSWORD_HASHER,
  PasswordHasher,
} from '../../../modules/auth/domain/services/password-hasher';
import {
  USER_CONSENT_REPOSITORY,
  UserConsentRepository,
} from '../../../modules/identity/domain/repositories/user-consent.repository';
import {
  USER_PROFILE_REPOSITORY,
  UserProfileRepository,
} from '../../../modules/identity/domain/repositories/user-profile.repository';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../../modules/identity/domain/repositories/user.repository';
import { normalizeEmail } from '../../../common/utilities/normalize-email';
import { normalizePhone } from '../../../common/utilities/normalize-phone';

@Injectable()
export class DemoCustomerSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DemoCustomerSeedService.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly usersRepository: UserRepository,
    @Inject(USER_PROFILE_REPOSITORY)
    private readonly profilesRepository: UserProfileRepository,
    @Inject(USER_CONSENT_REPOSITORY)
    private readonly consentsRepository: UserConsentRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.ensureDemoCustomer();
  }

  private async ensureDemoCustomer(): Promise<void> {
    const email = normalizeEmail('customer@couponhub-demo.sy');
    const phone = normalizePhone('+963944770701');
    const existing = await this.usersRepository.findActiveByIdentifier({
      email,
      phone,
    });

    if (existing) {
      const profile = await this.profilesRepository.findByUserId(existing.id);

      if (!profile) {
        await this.profilesRepository.create({
          userId: existing.id,
          fullName: 'عميل تجريبي CouponHub',
        });
      }

      return;
    }

    const passwordHash = await this.passwordHasher.hash('Customer@123');
    const user = await this.usersRepository.create({
      email,
      phone,
      passwordHash,
      platformRole: 'USER',
      status: 'ACTIVE',
    });

    await this.profilesRepository.create({
      userId: user.id,
      fullName: 'عميل تجريبي CouponHub',
    });

    const grantedAt = new Date();
    await this.consentsRepository.createMany([
      {
        userId: user.id,
        consentType: 'TERMS',
        status: 'GRANTED',
        policyVersion: 'mvp-v0.2',
        grantedAt,
      },
      {
        userId: user.id,
        consentType: 'PRIVACY',
        status: 'GRANTED',
        policyVersion: 'mvp-v0.2',
        grantedAt,
      },
    ]);

    this.logger.log('Demo customer seed created: customer@couponhub-demo.sy');
  }
}
