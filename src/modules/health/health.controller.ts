import { Controller, Get, ServiceUnavailableException, Version } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import { DatabaseHealthIndicator } from './indicators/database-health.indicator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly databaseHealthIndicator: DatabaseHealthIndicator,
  ) {}

  @Get('live')
  @Version('1')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiOkResponse({ description: 'Application process is alive' })
  getLive(): { status: string } {
    return { status: 'ok' };
  }

  @Get('ready')
  @Version('1')
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiOkResponse({ description: 'Application and dependencies are ready' })
  @ApiServiceUnavailableResponse({ description: 'One or more dependencies are unavailable' })
  async getReady(): Promise<Record<string, unknown>> {
    const result = await this.databaseHealthIndicator.check();

    if (result.status !== 'ok') {
      throw new ServiceUnavailableException({
        code: 'SERVICE_NOT_READY',
        message: {
          ar: 'تعذر تجهيز الخدمة حالياً لأن بعض الاعتمادات غير متاحة.',
          en: 'The application is not ready because one or more dependencies are unavailable.',
        },
        details: result,
      });
    }

    return result;
  }
}
