import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

function isEnabled(configService: ConfigService): boolean {
  return (configService.get<string>('SWAGGER_ENABLED') ?? 'true') === 'true';
}

export function setupSwagger(
  app: INestApplication,
  configService: ConfigService,
): void {
  if (!isEnabled(configService)) {
    return;
  }

  const title = configService.get<string>('APP_NAME') ?? 'CouponHub API';
  const swaggerPath = configService.get<string>('SWAGGER_PATH') ?? 'api/docs';
  const description =
    configService.get<string>('SWAGGER_DESCRIPTION') ??
    'CouponHub Syria MVP API';
  const version = configService.get<string>('APP_VERSION') ?? '1.0.0';

  const documentBuilder = new DocumentBuilder()
    .setTitle(title)
    .setDescription(description)
    .setVersion(version)
    .addBearerAuth();

  const document = SwaggerModule.createDocument(app, documentBuilder.build());

  SwaggerModule.setup(swaggerPath, app, document, {
    jsonDocumentUrl: `${swaggerPath}-json`,
  });
}
