import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getAppInfo() {
    return {
      name: process.env.APP_NAME ?? 'copoun-api',
      status: 'ok',
    };
  }
}
