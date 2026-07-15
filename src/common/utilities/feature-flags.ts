import { ConfigService } from '@nestjs/config';

/**
 * Checks if a given feature flag is enabled.
 * @param configService The NestJS config service.
 * @param name The feature flag name (e.g., 'campaignCopilot', 'smartSearch', 'trustShield', 'impactMetrics', 'offlineRedemption').
 */
export function isFeatureEnabled(
  configService: ConfigService,
  name: string,
): boolean {
  return configService.get<boolean>(`features.${name}`) === true;
}
