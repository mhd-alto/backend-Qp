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
  PASSWORD_HASHER,
  PasswordHasher,
} from '../../../auth/domain/services/password-hasher';
import {
  USER_PROFILE_REPOSITORY,
  UserProfileRepository,
} from '../../../identity/domain/repositories/user-profile.repository';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../../identity/domain/repositories/user.repository';
import { ProvisionPersonDto } from '../../api/dto/provision-business.request';

@Injectable()
export class OrganizationUserProvisioningService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(USER_PROFILE_REPOSITORY)
    private readonly userProfileRepository: UserProfileRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async createOrReuseUser(
    person: ProvisionPersonDto,
    manager: EntityManager,
  ): Promise<{ userId: string }> {
    const email = normalizeEmail(person.email);
    const phone = normalizePhone(person.phone);

    const existingUser = await this.userRepository.findActiveByIdentifier({
      email,
      phone,
    });

    if (existingUser) {
      const profile = await this.userProfileRepository.findByUserId(existingUser.id);

      if (!profile) {
        await this.userProfileRepository.create(
          {
            userId: existingUser.id,
            fullName: person.fullName.trim(),
          },
          manager,
        );
      }

      return { userId: existingUser.id };
    }

    const passwordHash = await this.passwordHasher.hash(person.password);
    const user = await this.userRepository.create(
      {
        email,
        phone,
        passwordHash,
        platformRole: 'USER',
        status: 'ACTIVE',
      },
      manager,
    );

    await this.userProfileRepository.create(
      {
        userId: user.id,
        fullName: person.fullName.trim(),
      },
      manager,
    );

    return { userId: user.id };
  }
}
