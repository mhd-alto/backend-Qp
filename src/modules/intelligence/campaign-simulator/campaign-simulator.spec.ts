import { simulateCampaign } from './campaign-simulator';

describe('CampaignSimulator - simulateCampaign', () => {
  it('should return simulated estimates as ranges', () => {
    const result = simulateCampaign({
      discountPercent: 15,
      couponQuota: 500,
      campaignDays: 10,
      businessCategory: 'restaurant',
    });

    expect(result.estimatedClaimsMin).toBeLessThanOrEqual(result.estimatedClaimsMax);
    expect(result.estimatedRedemptionsMin).toBeLessThanOrEqual(result.estimatedRedemptionsMax);
    expect(result.estimatedConversionMin).toBeLessThanOrEqual(result.estimatedConversionMax);
    expect(result.estimatedSavingsMin).toBeLessThanOrEqual(result.estimatedSavingsMax);
  });

  it('should assign correct risk levels based on inputs', () => {
    const lowRisk = simulateCampaign({
      discountPercent: 15,
      couponQuota: 500,
      campaignDays: 14,
    });
    expect(lowRisk.riskLevel).toBe('Low');

    const highRisk = simulateCampaign({
      discountPercent: 55,
      couponQuota: 1000,
      campaignDays: 14,
    });
    expect(highRisk.riskLevel).toBe('High');
  });

  it('should generate explanations dynamically based on rules', () => {
    const result = simulateCampaign({
      discountPercent: 50,
      couponQuota: 200,
      campaignDays: 7,
    });

    expect(result.explanation).toContain('High discount');
  });
});
