import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { REQUIRE_FEATURE_KEY } from '../decorators/require-feature.decorator';

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredFeature = this.reflector.getAllAndOverride<string>(
      REQUIRE_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredFeature) {
      return true;
    }

    const isEnabled = this.configService.get<boolean>(
      `features.${requiredFeature}`,
    );

    if (!isEnabled) {
      throw new NotFoundException(
        `The requested feature '${requiredFeature}' is not enabled.`,
      );
    }

    return true;
  }
}
