import { INestApplication } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

function parseOrigins(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function setupCors(
  app: INestApplication,
  configService: ConfigService,
): void {
  const origins = parseOrigins(configService.get<string>("ALLOWED_ORIGINS"));

  app.enableCors({
    origin: origins.length === 0 ? ["http://localhost:3001"] : origins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });
}
