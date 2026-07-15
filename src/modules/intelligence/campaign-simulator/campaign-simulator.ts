export const CATEGORY_DEFAULTS: Record<string, { avgBill: number; baseRedemptionRate: number }> = {
  restaurant: { avgBill: 35000, baseRedemptionRate: 0.25 },
  retail: { avgBill: 75000, baseRedemptionRate: 0.15 },
  services: { avgBill: 50000, baseRedemptionRate: 0.12 },
  food: { avgBill: 20000, baseRedemptionRate: 0.22 },
  default: { avgBill: 30000, baseRedemptionRate: 0.15 },
};

export interface SimulateCampaignInput {
  discountPercent: number;
  couponQuota: number;
  campaignDays: number;
  businessCategory?: string;
  historicalAvgRedemptionRate?: number;
}

export interface SimulateCampaignResult {
  estimatedClaimsMin: number;
  estimatedClaimsMax: number;
  estimatedRedemptionsMin: number;
  estimatedRedemptionsMax: number;
  estimatedConversionMin: number;
  estimatedConversionMax: number;
  estimatedSavingsMin: number;
  estimatedSavingsMax: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  explanation: string;
}

/**
 * Deterministic rule-based engine to estimate campaign impact.
 */
export function simulateCampaign(
  input: SimulateCampaignInput,
): SimulateCampaignResult {
  const {
    discountPercent,
    couponQuota,
    campaignDays,
    businessCategory,
    historicalAvgRedemptionRate,
  } = input;

  // Resolve category defaults
  const catKey = businessCategory ? businessCategory.toLowerCase() : 'default';
  const defaults = CATEGORY_DEFAULTS[catKey] || CATEGORY_DEFAULTS.default;

  const baseRedemptionRate = historicalAvgRedemptionRate ?? defaults.baseRedemptionRate;
  const avgBill = defaults.avgBill;

  // 1. Calculate claim rate (how many coupons are claimed out of quota)
  // Higher discount -> higher claim rate
  let baseClaimRate = 0.3;
  if (discountPercent >= 50) {
    baseClaimRate = 0.9;
  } else if (discountPercent >= 25) {
    baseClaimRate = 0.75;
  } else if (discountPercent >= 10) {
    baseClaimRate = 0.55;
  }

  // Adjust for duration (longer duration slightly increases total claims up to quota)
  const durationFactor = Math.min(1.2, 0.8 + campaignDays / 30);
  const adjustedClaimRate = Math.min(1.0, baseClaimRate * durationFactor);

  const estimatedClaimsMin = Math.round(couponQuota * adjustedClaimRate * 0.8);
  const estimatedClaimsMax = Math.round(couponQuota * adjustedClaimRate * 1.1);

  // 2. Calculate redemption rate
  // Lift factor based on discount magnitude
  const liftFactor = Math.log(discountPercent + 1) / Math.log(20);
  const calculatedRedemptionRate = Math.min(
    0.9,
    Math.max(0.05, baseRedemptionRate * liftFactor),
  );

  const estimatedRedemptionsMin = Math.round(
    estimatedClaimsMin * calculatedRedemptionRate * 0.8,
  );
  const estimatedRedemptionsMax = Math.round(
    estimatedClaimsMax * calculatedRedemptionRate * 1.1,
  );

  // Conversion rate percentage
  const estimatedConversionMin = Math.round(calculatedRedemptionRate * 80);
  const estimatedConversionMax = Math.round(calculatedRedemptionRate * 110);

  // 3. Savings (discountAmount * redemptions)
  const savingsPerRedemption = avgBill * (discountPercent / 100);
  const estimatedSavingsMin = Math.round(estimatedRedemptionsMin * savingsPerRedemption);
  const estimatedSavingsMax = Math.round(estimatedRedemptionsMax * savingsPerRedemption);

  // 4. Risk Level
  let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
  if (discountPercent >= 50 || (discountPercent >= 35 && couponQuota >= 1000)) {
    riskLevel = 'High';
  } else if (discountPercent >= 30 || couponQuota >= 1500) {
    riskLevel = 'Medium';
  }

  // 5. Plain Language Explanation
  let explanation = '';
  if (discountPercent >= 50) {
    explanation = `High discount of ${discountPercent}% will drive maximum user claims (~${Math.round(adjustedClaimRate * 100)}%), but margin dilution risk is High.`;
  } else if (discountPercent >= 30) {
    explanation = `Balanced discount of ${discountPercent}% provides a strong incentive with moderate volume, resulting in a Medium risk level.`;
  } else {
    explanation = `Conservative discount of ${discountPercent}% keeps liability low, but may suffer from lower engagement and claim rates.`;
  }

  return {
    estimatedClaimsMin: Math.max(0, Math.min(couponQuota, estimatedClaimsMin)),
    estimatedClaimsMax: Math.max(0, Math.min(couponQuota, estimatedClaimsMax)),
    estimatedRedemptionsMin: Math.max(0, Math.min(couponQuota, estimatedRedemptionsMin)),
    estimatedRedemptionsMax: Math.max(0, Math.min(couponQuota, estimatedRedemptionsMax)),
    estimatedConversionMin: Math.max(0, Math.min(100, estimatedConversionMin)),
    estimatedConversionMax: Math.max(0, Math.min(100, estimatedConversionMax)),
    estimatedSavingsMin,
    estimatedSavingsMax,
    riskLevel,
    explanation,
  };
}
