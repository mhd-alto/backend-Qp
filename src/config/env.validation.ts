type EnvShape = Record<string, string | undefined>;

const requiredGroups = [
  ['DATABASE_HOST', 'DB_HOST'],
  ['DATABASE_PORT', 'DB_PORT'],
  ['DATABASE_USER', 'DB_USERNAME'],
  ['DATABASE_PASSWORD', 'DB_PASSWORD'],
  ['DATABASE_NAME', 'DB_NAME'],
] as const;

const requiredAuthKeys = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const;

function getRequiredValue(config: EnvShape, keys: readonly string[]): string {
  const value = keys.map((key) => config[key]).find(Boolean);

  if (!value) {
    throw new Error(
      `Missing required environment variable. Expected one of: ${keys.join(', ')}`,
    );
  }

  return value;
}

function normalizeBoolean(
  config: EnvShape,
  key: string,
  defaultValue: 'true' | 'false',
): string {
  const value = config[key] ?? defaultValue;

  if (!['true', 'false'].includes(value)) {
    throw new Error(`${key} must be either true or false`);
  }

  return value;
}

export function validateEnv(config: EnvShape) {
  if (!config.PORT) {
    throw new Error('Missing required environment variable: PORT');
  }

  const port = Number(config.PORT);

  if (Number.isNaN(port) || port <= 0) {
    throw new Error('PORT must be a valid positive number');
  }

  const databasePort = Number(
    getRequiredValue(config, ['DATABASE_PORT', 'DB_PORT']),
  );

  if (Number.isNaN(databasePort) || databasePort <= 0) {
    throw new Error('DATABASE_PORT/DB_PORT must be a valid positive number');
  }

  for (const group of requiredGroups) {
    getRequiredValue(config, group);
  }

  for (const key of requiredAuthKeys) {
    getRequiredValue(config, [key]);
  }

  return {
    ...config,
    PORT: String(port),
    API_PREFIX: config.API_PREFIX ?? 'api',
    APP_NAME: config.APP_NAME ?? 'CouponHub API',
    APP_VERSION: config.APP_VERSION ?? '1.0.0',
    DEFAULT_LOCALE: config.DEFAULT_LOCALE ?? 'ar',
    SUPPORTED_LOCALES: config.SUPPORTED_LOCALES ?? 'ar,en',
    DATABASE_HOST: getRequiredValue(config, ['DATABASE_HOST', 'DB_HOST']),
    DATABASE_PORT: String(databasePort),
    DATABASE_USER: getRequiredValue(config, ['DATABASE_USER', 'DB_USERNAME']),
    DATABASE_PASSWORD: getRequiredValue(config, [
      'DATABASE_PASSWORD',
      'DB_PASSWORD',
    ]),
    DATABASE_NAME: getRequiredValue(config, ['DATABASE_NAME', 'DB_NAME']),
    DATABASE_SSL: normalizeBoolean(config, 'DATABASE_SSL', 'false'),
    DATABASE_MIGRATIONS_RUN: normalizeBoolean(
      config,
      'DATABASE_MIGRATIONS_RUN',
      'true',
    ),
    DATABASE_LOGGING: normalizeBoolean(config, 'DATABASE_LOGGING', 'false'),
    SWAGGER_ENABLED: normalizeBoolean(config, 'SWAGGER_ENABLED', 'true'),
    SWAGGER_PATH: config.SWAGGER_PATH ?? 'api/docs',
    SWAGGER_DESCRIPTION:
      config.SWAGGER_DESCRIPTION ?? 'CouponHub Syria MVP API documentation',
    JWT_ACCESS_SECRET: getRequiredValue(config, ['JWT_ACCESS_SECRET']),
    JWT_ACCESS_TTL: config.JWT_ACCESS_TTL ?? '15m',
    JWT_REFRESH_SECRET: getRequiredValue(config, ['JWT_REFRESH_SECRET']),
    JWT_REFRESH_TTL: config.JWT_REFRESH_TTL ?? '30d',
    PASSWORD_RESET_TTL: config.PASSWORD_RESET_TTL ?? '15m',
    ALLOWED_ORIGINS: config.ALLOWED_ORIGINS ?? '',
    MEDIA_DRIVER: config.MEDIA_DRIVER ?? 'local',
    MEDIA_LOCAL_PATH: config.MEDIA_LOCAL_PATH ?? 'uploads',
    MEDIA_PUBLIC_BASE_URL: config.MEDIA_PUBLIC_BASE_URL ?? '',
    FEATURE_CAMPAIGN_COPILOT: normalizeBoolean(
      config,
      'FEATURE_CAMPAIGN_COPILOT',
      'false',
    ),
    FEATURE_SMART_SEARCH: normalizeBoolean(
      config,
      'FEATURE_SMART_SEARCH',
      'false',
    ),
    FEATURE_TRUST_SHIELD: normalizeBoolean(
      config,
      'FEATURE_TRUST_SHIELD',
      'false',
    ),
    FEATURE_IMPACT_METRICS: normalizeBoolean(
      config,
      'FEATURE_IMPACT_METRICS',
      'false',
    ),
    FEATURE_OFFLINE_REDEMPTION: normalizeBoolean(
      config,
      'FEATURE_OFFLINE_REDEMPTION',
      'false',
    ),
    GEMINI_API_KEY: config.GEMINI_API_KEY ?? '',
  };
}
