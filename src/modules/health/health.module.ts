import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { HealthController } from './health.controller';
import { DatabaseHealthIndicator } from './indicators/database-health.indicator';

@Module({
  imports: [DatabaseModule],
  controllers: [HealthController],
  providers: [DatabaseHealthIndicator],
})
export class HealthModule {}
