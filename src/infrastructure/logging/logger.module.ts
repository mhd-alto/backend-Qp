import { Global, Module } from '@nestjs/common';
import { GlobalExceptionFilter } from '../../common/filters/global-exception.filter';
import { LoggingInterceptor } from '../../common/interceptors/logging.interceptor';
import { ApplicationLoggerService } from './application-logger.service';

@Global()
@Module({
  providers: [
    ApplicationLoggerService,
    LoggingInterceptor,
    GlobalExceptionFilter,
  ],
  exports: [
    ApplicationLoggerService,
    LoggingInterceptor,
    GlobalExceptionFilter,
  ],
})
export class LoggerModule {}
