import { Inject, Injectable } from '@nestjs/common';
import {
  AUTH_SESSION_REPOSITORY,
  AuthSessionRepository,
} from '../../domain/repositories/auth-session.repository';
import { LogoutRequestDto } from '../../api/dto/logout.request';
import { TOKEN_SERVICE, TokenService } from '../../domain/services/token-service';

@Injectable()
export class LogoutService {
  constructor(
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepository: AuthSessionRepository,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: LogoutRequestDto): Promise<void> {
    const payload = this.tokenService.verifyRefreshToken(input.refreshToken);
    await this.authSessionRepository.revokeById(payload.sid, 'LOGOUT');
  }
}
