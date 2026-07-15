import { registerAs } from '@nestjs/config';

export const mediaConfig = registerAs('media', () => ({
  driver: process.env.MEDIA_DRIVER ?? 'local',
  localPath: process.env.MEDIA_LOCAL_PATH ?? 'uploads',
  publicBaseUrl: process.env.MEDIA_PUBLIC_BASE_URL ?? '',
}));
