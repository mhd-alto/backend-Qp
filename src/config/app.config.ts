import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  name: process.env.APP_NAME ?? 'CouponHub API',
  version: process.env.APP_VERSION ?? '1.0.0',
  port: Number(process.env.PORT ?? 3000),
  apiPrefix: process.env.API_PREFIX ?? 'api',
  defaultLocale: process.env.DEFAULT_LOCALE ?? 'ar',
  supportedLocales: (process.env.SUPPORTED_LOCALES ?? 'ar,en')
    .split(',')
    .map((locale) => locale.trim())
    .filter(Boolean),
}));
