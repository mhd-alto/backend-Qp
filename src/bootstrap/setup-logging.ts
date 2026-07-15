import { INestApplication } from '@nestjs/common';
import { GlobalExceptionFilter } from '../common/filters/global-exception.filter';
import { LoggingInterceptor } from '../common/interceptors/logging.interceptor';
import { ApplicationLoggerService } from '../infrastructure/logging/application-logger.service';

export function setupLogging(app: INestApplication): void {
  const logger = app.get(ApplicationLoggerService, { strict: false });

  if (logger) {
    app.useLogger(logger);
  }

  const loggingInterceptor = app.get(LoggingInterceptor, { strict: false });
  if (loggingInterceptor) {
    app.useGlobalInterceptors(loggingInterceptor);
  }

  const exceptionFilter = app.get(GlobalExceptionFilter, { strict: false });
  if (exceptionFilter) {
    app.useGlobalFilters(exceptionFilter);
  }
}
