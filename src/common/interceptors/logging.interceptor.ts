import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { ApplicationLoggerService } from '../../infrastructure/logging/application-logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: ApplicationLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const now = Date.now();
    const http = context.switchToHttp();
    const request = http.getRequest<{
      method?: string;
      url?: string;
      headers?: Record<string, unknown>;
      user?: { userId?: string };
      businessMembership?: { businessId?: string };
    }>();
    const requestIdHeader = request.headers?.['x-request-id'];
    const requestId =
      typeof requestIdHeader === 'string' ? requestIdHeader : null;

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.logRequest({
            method: request.method ?? 'UNKNOWN',
            path: request.url ?? '/',
            durationMs: Date.now() - now,
            requestId,
            userId: request.user?.userId ?? null,
            businessId: request.businessMembership?.businessId ?? null,
          });
        },
        error: (error: unknown) => {
          this.logger.errorRequest({
            method: request.method ?? 'UNKNOWN',
            path: request.url ?? '/',
            durationMs: Date.now() - now,
            requestId,
            userId: request.user?.userId ?? null,
            businessId: request.businessMembership?.businessId ?? null,
            errorCode:
              error instanceof Error && 'code' in error
                ? String((error as { code?: unknown }).code ?? 'REQUEST_FAILED')
                : 'REQUEST_FAILED',
            error:
              error instanceof Error ? error.message : 'Unknown request error',
          });
        },
      }),
    );
  }
}
