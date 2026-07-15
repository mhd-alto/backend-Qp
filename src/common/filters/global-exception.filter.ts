import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  FRIENDLY_MESSAGES,
  LocalizedMessage,
  SupportedLocale,
} from '../constants/localized-messages';
import { resolveLocale } from '../utilities/resolve-locale';

type ErrorResponseBody = {
  statusCode: number;
  code: string;
  message: string | string[];
  details: unknown;
  locale: SupportedLocale;
  requestId: string | null;
  timestamp: string;
  path: string;
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const payload =
      exception instanceof HttpException ? exception.getResponse() : null;

    const body = this.buildBody(statusCode, payload, request);
    response.status(statusCode).json(body);
  }

  private buildBody(
    statusCode: number,
    payload: string | object | null,
    request: Request,
  ): ErrorResponseBody {
    const locale = resolveLocale(
      typeof request.headers['accept-language'] === 'string'
        ? request.headers['accept-language']
        : undefined,
    );

    if (payload && typeof payload === 'object') {
      const responsePayload = payload as Record<string, unknown>;
      const code = String(responsePayload.code ?? this.defaultCode(statusCode));

      return {
        statusCode,
        code,
        message: this.resolveMessage(locale, code, responsePayload.message),
        details: responsePayload.details ?? null,
        locale,
        requestId: this.getRequestId(request),
        timestamp: new Date().toISOString(),
        path: request.url,
      };
    }

    return {
      statusCode,
      code: this.defaultCode(statusCode),
      message: this.resolveMessage(
        locale,
        this.defaultCode(statusCode),
        typeof payload === 'string' ? payload : undefined,
      ),
      details: null,
      locale,
      requestId: this.getRequestId(request),
      timestamp: new Date().toISOString(),
      path: request.url,
    };
  }

  private getRequestId(request: Request): string | null {
    const requestId = request.headers['x-request-id'];
    return typeof requestId === 'string' ? requestId : null;
  }

  private defaultCode(statusCode: number): string {
    if (statusCode === HttpStatus.BAD_REQUEST) {
      return 'VALIDATION_ERROR';
    }

    if (statusCode === HttpStatus.FORBIDDEN) {
      return 'FORBIDDEN';
    }

    if (statusCode === HttpStatus.NOT_FOUND) {
      return 'RESOURCE_NOT_FOUND';
    }

    return 'INTERNAL_SERVER_ERROR';
  }

  private defaultMessage(statusCode: number): string {
    if (statusCode === HttpStatus.INTERNAL_SERVER_ERROR) {
      return 'Internal server error';
    }

    return 'Request failed';
  }

  private resolveMessage(
    locale: SupportedLocale,
    code: string,
    rawMessage: unknown,
  ): string | string[] {
    if (this.isLocalizedMessage(rawMessage)) {
      return rawMessage[locale];
    }

    if (Array.isArray(rawMessage)) {
      return rawMessage;
    }

    if (typeof rawMessage === 'string' && rawMessage.trim() !== '') {
      return rawMessage;
    }

    return FRIENDLY_MESSAGES[code]?.[locale] ?? FRIENDLY_MESSAGES.REQUEST_FAILED[locale];
  }

  private isLocalizedMessage(value: unknown): value is LocalizedMessage {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const candidate = value as Partial<LocalizedMessage>;
    return typeof candidate.ar === 'string' && typeof candidate.en === 'string';
  }
}
