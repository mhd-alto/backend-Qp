import { simulateCampaign, SimulateCampaignResult } from '../campaign-simulator/campaign-simulator';

export interface RecommendCampaignInput {
  goal: 'attract_new' | 'increase_weekday' | 'clear_inventory' | 'promote_new' | 'bring_back';
  businessCategory: string;
  avgBillValue: number;
  approxMargin: number; // e.g. 0.4 for 40%
  slowDays: string[]; // e.g. ["Monday", "Tuesday"]
  targetCustomerCount: number;
  campaignDurationDays: number;
}

export interface RecommendCampaignResult {
  discountPercent: number;
  couponQuota: number;
  startHour: string | null;
  endHour: string | null;
  applicableDays: string[] | null;
  simulation: SimulateCampaignResult;
  warnings: string[];
}

/**
 * Heuristics-based recommendation engine for campaigns.
 */
export function recommendCampaign(
  input: RecommendCampaignInput,
): RecommendCampaignResult {
  const {
    goal,
    businessCategory,
    avgBillValue,
    approxMargin,
    slowDays,
    targetCustomerCount,
    campaignDurationDays,
  } = input;

  let discountPercent = 20;
  let expectedRedemptionRate = 0.25;
  let startHour: string | null = null;
  let endHour: string | null = null;
  let applicableDays: string[] | null = null;

  // 1. Heuristics for discount percent and expected redemption rates
  const marginPercent = approxMargin * 100;

  switch (goal) {
    case 'attract_new':
      // Strong incentive needed, keep it safe relative to margin if possible
      discountPercent = Math.max(15, Math.min(30, Math.round(marginPercent * 0.75)));
      expectedRedemptionRate = 0.25;
      break;
    case 'increase_weekday':
      // Moderate incentive targeting slow days
      discountPercent = Math.max(10, Math.min(20, Math.round(marginPercent * 0.5)));
      expectedRedemptionRate = 0.30;
      applicableDays = slowDays.length > 0 ? slowDays : ['Monday', 'Tuesday', 'Wednesday'];
      // Restrict to off-peak hours
      startHour = '14:00';
      endHour = '18:00';
      break;
    case 'clear_inventory':
      // High discount to clear products quickly
      discountPercent = Math.max(25, Math.min(45, Math.round(marginPercent * 0.9)));
      expectedRedemptionRate = 0.40;
      break;
    case 'promote_new':
      // Balanced incentive for trial
      discountPercent = Math.max(15, Math.min(25, Math.round(marginPercent * 0.6)));
      expectedRedemptionRate = 0.20;
      break;
    case 'bring_back':
      // Attractive discount for past customers
      discountPercent = Math.max(20, Math.min(35, Math.round(marginPercent * 0.8)));
      expectedRedemptionRate = 0.35;
      break;
  }

  // 2. Heuristics for coupon quota calculation
  const couponQuota = Math.round(targetCustomerCount / expectedRedemptionRate);

  // 3. Generate simulation ranges
  const simulation = simulateCampaign({
    discountPercent,
    couponQuota,
    campaignDays: campaignDurationDays,
    businessCategory,
  });

  // 4. Generate warnings
  const warnings: string[] = [];
  if (discountPercent >= marginPercent) {
    warnings.push(
      `Warning: The recommended discount of ${discountPercent}% is equal to or exceeds your profit margin of ${marginPercent}%.`,
    );
  }
  const maxLiability = couponQuota * (avgBillValue * (discountPercent / 100));
  if (maxLiability > 5000000) {
    warnings.push(
      `Warning: Potential maximum discount liability is high (${Math.round(maxLiability).toLocaleString()} SYP).`,
    );
  }

  return {
    discountPercent,
    couponQuota,
    startHour,
    endHour,
    applicableDays,
    simulation,
    warnings,
  };
}
