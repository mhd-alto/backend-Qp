import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { FRIENDLY_MESSAGES } from '../../../../common/constants/localized-messages';
import { AuthenticatedPrincipal } from '../../../../common/types/authenticated-principal';
import { AUDIT_WRITER } from '../../../audit/contracts/audit.tokens';
import { AuditWriter } from '../../../audit/contracts/audit-writer';
import {
  AUTH_SESSION_REPOSITORY,
  AuthSessionRepository,
} from '../../../auth/domain/repositories/auth-session.repository';
import {
  USER_PROFILE_REPOSITORY,
  UserProfileRepository,
} from '../../domain/repositories/user-profile.repository';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../domain/repositories/user.repository';
import { UserStatusRequestDto } from '../../api/dto/user-status.request';
import { UserSummaryResponseDto } from '../../api/dto/user-summary.response';

@Injectable()
export class SetUserStatusService {
  constructor(
    private readonly dataSource: DataSource,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(USER_PROFILE_REPOSITORY)
    private readonly profileRepository: UserProfileRepository,
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepository: AuthSessionRepository,
    @Inject(AUDIT_WRITER)
    private readonly auditWriter: AuditWriter,
  ) {}

  async execute(
    userId: string,
    input: UserStatusRequestDto,
    actor: AuthenticatedPrincipal,
  ): Promise<UserSummaryResponseDto> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: FRIENDLY_MESSAGES.RESOURCE_NOT_FOUND,
      });
    }

    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: FRIENDLY_MESSAGES.RESOURCE_NOT_FOUND,
      });
    }

    await this.dataSource.transaction(async (manager) => {
      await this.userRepository.updateStatus(userId, input.status, manager);

      if (input.status === 'SUSPENDED') {
        await this.authSessionRepository.revokeAllByUserId(
          userId,
          `USER_SUSPENDED_BY_ADMIN: ${input.reason}`,
          manager,
        );
      }
    });

    await this.auditWriter.write({
      actorUserId: actor.id,
      businessId: null,
      action: 'USER_STATUS_CHANGED',
      entityType: 'USER',
      entityId: userId,
      metadata: {
        status: input.status,
        reason: input.reason,
      },
    });

    return {
      id: user.id,
      fullName: profile.fullName,
      email: user.email,
      phone: user.phone,
      platformRole: user.platformRole,
      status: input.status,
    };
  }
}
