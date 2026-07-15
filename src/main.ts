import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { ConfigService } from "@nestjs/config";
import { join } from "path";
import { AppModule } from "./app.module";
import { setupHelmet } from "./bootstrap/setup-helmet";
import { setupLogging } from "./bootstrap/setup-logging";
import { setupShutdownHooks } from "./bootstrap/setup-shutdown-hooks";
import { setupSwagger } from "./bootstrap/setup-swagger";
import { setupValidation } from "./bootstrap/setup-validation";
import { setupVersioning } from "./bootstrap/setup-versioning";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  const configService = app.get(ConfigService);
  const port = Number(configService.get("PORT") ?? 3000);
  const host = configService.get<string>("HOST") ?? "0.0.0.0";
  const apiPrefix = configService.get<string>("API_PREFIX") ?? "api";

  app.setGlobalPrefix(apiPrefix);
  app.useStaticAssets(join(process.cwd(), "uploads"), {
    prefix: "/uploads/",
  });
  setupHelmet(app);
  app.enableCors({
    origin: ["http://localhost:3001"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });
  setupVersioning(app);
  setupValidation(app);
  setupLogging(app);
  setupSwagger(app, configService);
  setupShutdownHooks(app);

  await app.listen(port, host);
  Logger.log(
    `API listening on http://localhost:${port}/${apiPrefix}`,
    "Bootstrap",
  );
  Logger.log(
    `LAN access enabled on http://<your-ip>:${port}/${apiPrefix}`,
    "Bootstrap",
  );
}

void bootstrap();
