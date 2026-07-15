import { INestApplication } from '@nestjs/common';

export function setupShutdownHooks(app: INestApplication): void {
  app.enableShutdownHooks();
}
