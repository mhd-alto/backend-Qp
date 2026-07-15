import { registerAs } from '@nestjs/config';

export const swaggerConfig = registerAs('swagger', () => ({
  enabled: (process.env.SWAGGER_ENABLED ?? 'true') === 'true',
  path: process.env.SWAGGER_PATH ?? 'api/docs',
  description:
    process.env.SWAGGER_DESCRIPTION ?? 'CouponHub Syria MVP API documentation',
}));
