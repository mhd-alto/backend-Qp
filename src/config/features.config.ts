import { registerAs } from '@nestjs/config';

export const featuresConfig = registerAs('features', () => ({
  campaignCopilot: process.env.FEATURE_CAMPAIGN_COPILOT === 'true',
  smartSearch: process.env.FEATURE_SMART_SEARCH === 'true',
  trustShield: process.env.FEATURE_TRUST_SHIELD === 'true',
  impactMetrics: process.env.FEATURE_IMPACT_METRICS === 'true',
  offlineRedemption: process.env.FEATURE_OFFLINE_REDEMPTION === 'true',
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
}));
