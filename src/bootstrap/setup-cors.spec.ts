import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { setupCors } from "./setup-cors";

describe("setupCors", () => {
  it("configures the expected CORS policy for the frontend origin", async () => {
    const app = { enableCors: jest.fn() } as unknown as INestApplication;
    const configService = {
      get: jest.fn((key: string) => {
        if (key === "ALLOWED_ORIGINS") {
          return "http://localhost:3001";
        }
        return undefined;
      }),
    } as unknown as ConfigService;

    setupCors(app, configService);

    expect(app.enableCors).toHaveBeenCalledWith({
      origin: ["http://localhost:3001"],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    });
  });
});
