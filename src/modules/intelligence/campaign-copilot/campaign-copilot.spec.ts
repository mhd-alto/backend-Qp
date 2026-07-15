import { recommendCampaign } from './campaign-copilot';
import { GeminiService } from './gemini.service';
import { ConfigService } from '@nestjs/config';

describe('CampaignCopilot - recommendCampaign', () => {
  it('should recommend correct discount for attract_new goal', () => {
    const result = recommendCampaign({
      goal: 'attract_new',
      businessCategory: 'restaurant',
      avgBillValue: 20000,
      approxMargin: 0.4,
      slowDays: [],
      targetCustomerCount: 50,
      campaignDurationDays: 14,
    });

    expect(result.discountPercent).toBeGreaterThanOrEqual(15);
    expect(result.discountPercent).toBeLessThanOrEqual(30);
    expect(result.couponQuota).toBeGreaterThan(50);
  });

  it('should restrict to slowDays and off-peak hours for increase_weekday goal', () => {
    const result = recommendCampaign({
      goal: 'increase_weekday',
      businessCategory: 'restaurant',
      avgBillValue: 20000,
      approxMargin: 0.4,
      slowDays: ['Monday', 'Wednesday'],
      targetCustomerCount: 50,
      campaignDurationDays: 14,
    });

    expect(result.applicableDays).toEqual(['Monday', 'Wednesday']);
    expect(result.startHour).toBe('14:00');
    expect(result.endHour).toBe('18:00');
  });

  it('should issue warning if discount exceeds profit margin', () => {
    const result = recommendCampaign({
      goal: 'clear_inventory',
      businessCategory: 'retail',
      avgBillValue: 10000,
      approxMargin: 0.1, // very low margin (10%)
      slowDays: [],
      targetCustomerCount: 10,
      campaignDurationDays: 7,
    });

    expect(result.warnings.some((w) => w.includes('profit margin'))).toBe(true);
  });
});

describe('GeminiService - Fallback Content', () => {
  it('should return fallback copy if API key is missing', async () => {
    const configServiceMock = {
      get: jest.fn().mockReturnValue(''),
    } as unknown as ConfigService;

    const service = new GeminiService(configServiceMock);
    const content = await service.generateCampaignContent(
      { discountPercent: 20 },
      'restaurant',
      'attract_new',
    );

    expect(content.titleAr).toContain('خصم 20%');
    expect(content.titleEn).toContain('20%');
    expect(content.reason).toBeDefined();
  });
});
