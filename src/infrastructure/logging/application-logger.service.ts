import { ConsoleLogger, Injectable } from '@nestjs/common';

type RequestLogPayload = {
  method: string;
  path: string;
  durationMs: number;
  requestId?: string | null;
  userId?: string | null;
  businessId?: string | null;
  module?: string;
  action?: string;
  errorCode?: string | null;
};

type ErrorLogPayload = RequestLogPayload & {
  error: string;
};

@Injectable()
export class ApplicationLoggerService extends ConsoleLogger {
  logRequest(payload: RequestLogPayload): void {
    this.log(
      JSON.stringify({
        level: 'log',
        method: payload.method,
        path: payload.path,
        durationMs: payload.durationMs,
        requestId: payload.requestId ?? null,
        userId: payload.userId ?? null,
        businessId: payload.businessId ?? null,
        module: payload.module ?? 'http',
        action: payload.action ?? `${payload.method} ${payload.path}`,
        errorCode: payload.errorCode ?? null,
        timestamp: new Date().toISOString(),
      }),
    );
  }

  errorRequest(payload: ErrorLogPayload): void {
    this.error(
      JSON.stringify({
        level: 'error',
        method: payload.method,
        path: payload.path,
        durationMs: payload.durationMs,
        requestId: payload.requestId ?? null,
        userId: payload.userId ?? null,
        businessId: payload.businessId ?? null,
        module: payload.module ?? 'http',
        action: payload.action ?? `${payload.method} ${payload.path}`,
        errorCode: payload.errorCode ?? 'REQUEST_FAILED',
        error: payload.error,
        timestamp: new Date().toISOString(),
      }),
    );
  }
}
