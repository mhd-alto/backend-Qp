import { Body, Controller, Post, UseGuards, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { FeatureFlagGuard } from '../../../common/guards/feature-flag.guard';
import { RequireFeature } from '../../../common/decorators/require-feature.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedPrincipal } from '../../../common/types/authenticated-principal';
import { BusinessCampaignsService } from '../../campaigns/application/business-campaigns.service';
import { recommendCampaign } from './campaign-copilot';
import { GeminiService } from './gemini.service';
import {
  RecommendCampaignRequestDto,
  GenerateContentRequestDto,
  CreateFromRecommendationRequestDto,
} from './dto/copilot.dto';

@ApiTags('Business Campaigns Intelligence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FeatureFlagGuard)
@RequireFeature('campaignCopilot')
@Controller('business/campaigns/copilot')
export class CampaignCopilotController {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly businessCampaignsService: BusinessCampaignsService,
  ) {}

  @Post('recommend')
  @Version('1')
  @ApiOperation({ summary: 'Get a rule-based campaign recommendation and simulation' })
  @ApiOkResponse({ description: 'The recommendation object with rules and warnings.' })
  async recommend(@Body() body: RecommendCampaignRequestDto) {
    return recommendCampaign({
      goal: body.goal,
      businessCategory: body.businessCategory,
      avgBillValue: body.avgBillValue,
      approxMargin: body.approxMargin,
      slowDays: body.slowDays,
      targetCustomerCount: body.targetCustomerCount,
      campaignDurationDays: body.campaignDurationDays,
    });
  }

  @Post('generate-content')
  @Version('1')
  @ApiOperation({ summary: 'Generate campaign copy and banner prompt via Gemini' })
  @ApiOkResponse({ description: 'Generated bilingual copy and assets.' })
  async generateContent(@Body() body: GenerateContentRequestDto) {
    return this.geminiService.generateCampaignContent(
      body.recommendation,
      body.businessCategory,
      body.goal,
    );
  }

  @Post('from-recommendation')
  @Version('1')
  @ApiOperation({ summary: 'Create a live campaign from a Copilot recommendation' })
  @ApiOkResponse({ description: 'UUID of the created campaign.' })
  async createFromRecommendation(
    @Body() body: CreateFromRecommendationRequestDto,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ) {
    const now = new Date();
    const end = new Date();
    end.setDate(now.getDate() + 14); // default 14 days campaign duration

    // Maps recommendation parameters to CreateCampaignRequestDto structure
    const campaignDto = {
      title: body.title,
      titleEn: body.titleEn || null,
      publicSlug: body.publicSlug,
      description: body.description,
      descriptionEn: body.descriptionEn || null,
      imageUrl: null,
      termsText: body.termsText,
      termsTextEn: body.termsTextEn || null,
      primaryCategoryId: body.primaryCategoryId,
      branchId: body.branchId,
      startAt: now.toISOString(),
      endAt: end.toISOString(),
      totalClaimLimit: body.couponQuota,
      isSearchable: true,
      benefit: {
        type: 'PERCENTAGE' as const,
        percentageValue: body.discountPercent,
        fixedAmount: null,
        currency: 'SYP',
        maxDiscountAmount: null,
        description: body.description,
        descriptionEn: body.descriptionEn || null,
      },
    };

    const campaignId = await this.businessCampaignsService.create(campaignDto as any, actor);
    return { campaignId };
  }
}
