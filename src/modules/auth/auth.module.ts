import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdentityModule } from '../identity/identity.module';
import { AuthController } from './api/auth.controller';
import { ForgotPasswordService } from './application/forgot-password/forgot-password.service';
import { LoginService } from './application/login/login.service';
import { LogoutService } from './application/logout/logout.service';
import { RefreshSessionService } from './application/refresh-session/refresh-session.service';
import { RegisterService } from './application/register/register.service';
import { ResetPasswordService } from './application/reset-password/reset-password.service';
import { AUTH_SESSION_REPOSITORY } from './domain/repositories/auth-session.repository';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from './domain/repositories/password-reset-token.repository';
import { PASSWORD_HASHER } from './domain/services/password-hasher';
import { TOKEN_SERVICE } from './domain/services/token-service';
import { JwtAuthGuard } from './infrastructure/guards/jwt-auth.guard';
import { PlatformRoleGuard } from './infrastructure/guards/platform-role.guard';
import { Argon2PasswordHasher } from './infrastructure/hashing/argon2-password-hasher';
import { JwtTokenService } from './infrastructure/jwt/jwt-token.service';
import { AuthSessionOrmEntity } from './infrastructure/persistence/typeorm/entities/auth-session.orm-entity';
import { PasswordResetTokenOrmEntity } from './infrastructure/persistence/typeorm/entities/password-reset-token.orm-entity';
import { TypeOrmAuthSessionRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-auth-session.repository';
import { TypeOrmPasswordResetTokenRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-password-reset-token.repository';

@Module({
  imports: [
    forwardRef(() => IdentityModule),
    TypeOrmModule.forFeature([AuthSessionOrmEntity, PasswordResetTokenOrmEntity]),
  ],
  controllers: [AuthController],
  providers: [
    RegisterService,
    LoginService,
    RefreshSessionService,
    LogoutService,
    ForgotPasswordService,
    ResetPasswordService,
    JwtAuthGuard,
    PlatformRoleGuard,
    TypeOrmAuthSessionRepository,
    TypeOrmPasswordResetTokenRepository,
    {
      provide: AUTH_SESSION_REPOSITORY,
      useExisting: TypeOrmAuthSessionRepository,
    },
    {
      provide: PASSWORD_RESET_TOKEN_REPOSITORY,
      useExisting: TypeOrmPasswordResetTokenRepository,
    },
    {
      provide: PASSWORD_HASHER,
      useClass: Argon2PasswordHasher,
    },
    {
      provide: TOKEN_SERVICE,
      useClass: JwtTokenService,
    },
  ],
  exports: [JwtAuthGuard, PlatformRoleGuard, TOKEN_SERVICE, PASSWORD_HASHER, AUTH_SESSION_REPOSITORY],
})
export class AuthModule {}
