import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { IdentityModule } from '../identity/identity.module';
import { MediaController } from './api/media.controller';

@Module({
  imports: [AuthModule, IdentityModule],
  controllers: [MediaController],
})
export class MediaModule {}
