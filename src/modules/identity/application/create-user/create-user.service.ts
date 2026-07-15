import {
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { FRIENDLY_MESSAGES } from '../../../../common/constants/localized-messages';
import { normalizeEmail } from '../../../../common/utilities/normalize-email';
import { normalizePhone } from '../../../../common/utilities/normalize-phone';
import {
  CreateCustomerAccountInput,
  IdentityAccountCreator,
  IdentityUserSummary,
} from '../../contracts/identity-account-creator';
import {
  AuthenticationIdentity,
  IdentityReader,
} from '../../contracts/identity-reader';
import { UserStatusReader } from '../../contracts/user-status-reader';
import {
  USER_CONSENT_REPOSITORY,
  UserConsentRepository,
} from '../../domain/repositories/user-consent.repository';
import {
  USER_PROFILE_REPOSITORY,
  UserProfileRepository,
} from '../../domain/repositories/user-profile.repository';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../domain/repositories/user.repository';

@Injectable()
export class CreateUserService
  implements IdentityAccountCreator, IdentityReader, UserStatusReader
{
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly usersRepository: UserRepository,
    @Inject(USER_PROFILE_REPOSITORY)
    private readonly profilesRepository: UserProfileRepository,
    @Inject(USER_CONSENT_REPOSITORY)
    private readonly consentsRepository: UserConsentRepository,
  ) {}

  async createCustomerAccount(
    input: CreateCustomerAccountInput,
    manager?: EntityManager,
  ): Promise<IdentityUserSummary> {
    const email = normalizeEmail(input.email);
    const phone = normalizePhone(input.phone);

    await this.ensureUniqueIdentifiers({ email, phone });

    const user = await this.usersRepository.create(
      {
        email,
        phone,
        passwordHash: input.passwordHash,
        platformRole: 'USER',
        status: 'ACTIVE',
      },
      manager,
    );

    await this.profilesRepository.create(
      {
        userId: user.id,
        fullName: input.fullName.trim(),
      },
      manager,
    );

    const grantedAt = new Date();
    await this.consentsRepository.createMany(
      [
        {
          userId: user.id,
          consentType: 'TERMS',
          status: 'GRANTED',
          policyVersion: input.policyVersion,
          grantedAt,
        },
        {
          userId: user.id,
          consentType: 'PRIVACY',
          status: 'GRANTED',
          policyVersion: input.policyVersion,
          grantedAt,
        },
      ],
      manager,
    );

    return {
      id: user.id,
      fullName: input.fullName.trim(),
      email: user.email,
      phone: user.phone,
      platformRole: user.platformRole,
      status: user.status,
    };
  }

  async findByIdentifier(
    identifier: string,
  ): Promise<AuthenticationIdentity | null> {
    const normalizedIdentifier = identifier.trim();
    const user = await this.usersRepository.findActiveByIdentifier({
      email: normalizedIdentifier.includes('@')
        ? normalizeEmail(normalizedIdentifier)
        : null,
      phone: normalizePhone(normalizedIdentifier),
    });

    if (!user) {
      return null;
    }

    const profile = await this.profilesRepository.findByUserId(user.id);

    if (!profile) {
      return null;
    }

    return {
      id: user.id,
      fullName: profile.fullName,
      email: user.email,
      phone: user.phone,
      platformRole: user.platformRole,
      status: user.status,
      passwordHash: user.passwordHash,
    };
  }

  async findById(userId: string): Promise<AuthenticationIdentity | null> {
    if (!userId) {
      return null;
    }

    return this.findIdentityByUserId(userId);
  }

  isActiveForAuthentication(status: string): boolean {
    return status === 'ACTIVE';
  }

  async markLoginSuccess(userId: string): Promise<void> {
    await this.usersRepository.updateLastLoginAt(userId, new Date());
  }

  private async ensureUniqueIdentifiers(
    input: { email: string | null; phone: string | null },
  ): Promise<void> {
    const existingUser = await this.usersRepository.findActiveByIdentifier(input);

    if (existingUser) {
      throw new ConflictException({
        code: 'IDENTIFIER_ALREADY_IN_USE',
        message: FRIENDLY_MESSAGES.IDENTIFIER_ALREADY_IN_USE,
      });
    }
  }

  private async findIdentityByUserId(
    userId: string,
  ): Promise<AuthenticationIdentity | null> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      return null;
    }

    const profile = await this.profilesRepository.findByUserId(user.id);

    if (!profile) {
      return null;
    }

    return {
      id: user.id,
      fullName: profile.fullName,
      email: user.email,
      phone: user.phone,
      platformRole: user.platformRole,
      status: user.status,
      passwordHash: user.passwordHash,
    };
  }
}
