import { Body, Controller, Post, UseGuards, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { FeatureFlagGuard } from '../../../common/guards/feature-flag.guard';
import { RequireFeature } from '../../../common/decorators/require-feature.decorator';
import { SimulateCampaignRequestDto } from './dto/simulate-campaign.request';
import { simulateCampaign, SimulateCampaignResult } from './campaign-simulator';

@ApiTags('Business Campaigns Intelligence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FeatureFlagGuard)
@RequireFeature('impactMetrics')
@Controller('business/campaigns')
export class CampaignSimulatorController {
  @Post('simulate')
  @Version('1')
  @ApiOperation({ summary: 'Simulate a coupon campaign scenario rule-based' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        simulated: { type: 'object' },
        scenarios: {
          type: 'object',
          properties: {
            conservative: { type: 'object' },
            balanced: { type: 'object' },
            aggressive: { type: 'object' },
          },
        },
        recommendedScenario: { type: 'string', example: 'balanced' },
      },
    },
  })
  async simulate(@Body() body: SimulateCampaignRequestDto) {
    const simulated = simulateCampaign({
      discountPercent: body.discountPercent,
      couponQuota: body.couponQuota,
      campaignDays: body.campaignDays,
      businessCategory: body.businessCategory,
      historicalAvgRedemptionRate: body.historicalAvgRedemptionRate,
    });

    // 1. Calculate Conservative Scenario (lower discount, lower quota)
    const conservativePercent = Math.max(5, Math.round(body.discountPercent * 0.75));
    const conservativeQuota = Math.max(10, Math.round(body.couponQuota * 0.6));
    const conservative = simulateCampaign({
      discountPercent: conservativePercent,
      couponQuota: conservativeQuota,
      campaignDays: body.campaignDays,
      businessCategory: body.businessCategory,
      historicalAvgRedemptionRate: body.historicalAvgRedemptionRate,
    });

    // 2. Calculate Balanced Scenario (current input)
    const balanced = simulated;

    // 3. Calculate Aggressive Scenario (higher discount, higher quota)
    const aggressivePercent = Math.min(85, Math.max(body.discountPercent, Math.round(body.discountPercent * 1.3)));
    const aggressiveQuota = Math.round(body.couponQuota * 1.4);
    const aggressive = simulateCampaign({
      discountPercent: aggressivePercent,
      couponQuota: aggressiveQuota,
      campaignDays: body.campaignDays,
      businessCategory: body.businessCategory,
      historicalAvgRedemptionRate: body.historicalAvgRedemptionRate,
    });

    // Helper to calculate redemptions-to-risk ratio
    const getRatio = (res: SimulateCampaignResult) => {
      const redemptions = (res.estimatedRedemptionsMin + res.estimatedRedemptionsMax) / 2;
      let riskFactor = 1.0;
      if (res.riskLevel === 'High') {
        riskFactor = 3.5;
      } else if (res.riskLevel === 'Medium') {
        riskFactor = 1.8;
      }
      return redemptions / riskFactor;
    };

    const scoreCons = getRatio(conservative);
    const scoreBal = getRatio(balanced);
    const scoreAggr = getRatio(aggressive);

    let recommendedScenario: 'conservative' | 'balanced' | 'aggressive' = 'balanced';
    let maxScore = scoreBal;

    if (scoreCons > maxScore) {
      maxScore = scoreCons;
      recommendedScenario = 'conservative';
    }
    if (scoreAggr > maxScore) {
      maxScore = scoreAggr;
      recommendedScenario = 'aggressive';
    }

    return {
      simulated,
      scenarios: {
        conservative,
        balanced,
        aggressive,
      },
      recommendedScenario,
    };
  }
}
