import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { databaseMigrations } from '../infrastructure/database/migrations';

function getString(
  configService: ConfigService,
  primaryKey: string,
  fallbackKey?: string,
): string {
  return configService.get<string>(primaryKey) ??
    (fallbackKey ? configService.getOrThrow<string>(fallbackKey) : '');
}

function getNumber(
  configService: ConfigService,
  primaryKey: string,
  fallbackKey?: string,
): number {
  const rawValue =
    configService.get<string>(primaryKey) ??
    (fallbackKey ? configService.get<string>(fallbackKey) : undefined);

  if (!rawValue) {
    throw new Error(`Missing required database config: ${primaryKey}`);
  }

  return Number(rawValue);
}

function getBoolean(
  configService: ConfigService,
  primaryKey: string,
  defaultValue: boolean,
  fallbackKey?: string,
): boolean {
  const rawValue =
    configService.get<string>(primaryKey) ??
    (fallbackKey ? configService.get<string>(fallbackKey) : undefined);

  if (!rawValue) {
    return defaultValue;
  }

  return rawValue.toLowerCase() === 'true';
}

export function getDatabaseConfig(
  configService: ConfigService,
): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: getString(configService, 'DATABASE_HOST', 'DB_HOST'),
    port: getNumber(configService, 'DATABASE_PORT', 'DB_PORT'),
    username: getString(configService, 'DATABASE_USER', 'DB_USERNAME'),
    password: getString(configService, 'DATABASE_PASSWORD', 'DB_PASSWORD'),
    database: getString(configService, 'DATABASE_NAME', 'DB_NAME'),
    ssl: getBoolean(configService, 'DATABASE_SSL', false),
    autoLoadEntities: true,
    synchronize: false,
    migrationsRun: getBoolean(configService, 'DATABASE_MIGRATIONS_RUN', true),
    logging: getBoolean(
      configService,
      'DATABASE_LOGGING',
      configService.get<string>('NODE_ENV') !== 'production',
    ),
    migrations: databaseMigrations,
  };
}
