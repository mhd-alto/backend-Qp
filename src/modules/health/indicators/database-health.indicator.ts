import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseHealthIndicator {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async check(): Promise<Record<string, unknown>> {
    try {
      await this.dataSource.query('SELECT 1');

      return {
        status: 'ok',
        database: 'up',
        checkedAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        database: 'down',
        checkedAt: new Date().toISOString(),
        message: error instanceof Error ? error.message : 'Database unavailable',
      };
    }
  }
}
