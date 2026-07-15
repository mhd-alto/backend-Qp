import { Body, Controller, Post, UseGuards, Version } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FeatureFlagGuard } from '../../../common/guards/feature-flag.guard';
import { RequireFeature } from '../../../common/decorators/require-feature.decorator';
import { SmartSearchRequestDto } from './dto/smart-search.request';
import { SmartOfferSearchService } from './smart-offer-search.service';

@ApiTags('Public Smart Search')
@UseGuards(FeatureFlagGuard)
@RequireFeature('smartSearch')
@Controller('public/offers')
export class SmartOfferSearchController {
  constructor(private readonly smartSearchService: SmartOfferSearchService) {}

  @Post('smart-search')
  @Version('1')
  @ApiOperation({
    summary: 'Search offers using natural language (Arabic or English)',
    description:
      'Disclaimer: We personalize results using only the current request parameters and explicit preferences, without building invasive personal profiles.',
  })
  @ApiOkResponse({ description: 'Interpreted filters and ranked offers results.' })
  async search(@Body() body: SmartSearchRequestDto) {
    return this.smartSearchService.search(body.queryText);
  }
}
