import 'reflect-metadata';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DataSource } from 'typeorm';
import { databaseMigrations } from './migrations';

function loadEnvFile(): void {
  const envPath = resolve(process.cwd(), '.env');

  if (!existsSync(envPath)) {
    return;
  }

  const content = readFileSync(envPath, 'utf8');
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

function getEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getBoolean(value: string): boolean {
  return value.toLowerCase() === 'true';
}

const appDataSource = new DataSource({
  type: 'postgres',
  host: getEnv('DATABASE_HOST', process.env.DB_HOST),
  port: Number(getEnv('DATABASE_PORT', process.env.DB_PORT)),
  username: getEnv('DATABASE_USER', process.env.DB_USERNAME),
  password: getEnv('DATABASE_PASSWORD', process.env.DB_PASSWORD),
  database: getEnv('DATABASE_NAME', process.env.DB_NAME),
  ssl: getBoolean(process.env.DATABASE_SSL ?? 'false'),
  synchronize: false,
  migrationsRun: getBoolean(process.env.DATABASE_MIGRATIONS_RUN ?? 'true'),
  logging: getBoolean(process.env.DATABASE_LOGGING ?? 'false'),
  migrations: databaseMigrations,
});

export default appDataSource;
