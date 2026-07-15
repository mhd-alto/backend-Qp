import { SmartOfferSearchService } from './smart-offer-search.service';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { CampaignOrmEntity } from '../../campaigns/infrastructure/persistence/typeorm/entities/campaign.orm-entity';

describe('SmartOfferSearchService - Local Intent Parsing', () => {
  let service: SmartOfferSearchService;
  let campaignRepositoryMock: Repository<CampaignOrmEntity>;

  beforeEach(() => {
    const configServiceMock = {
      get: jest.fn().mockReturnValue(''), // API Key empty to trigger local parsing fallback
    } as unknown as ConfigService;

    campaignRepositoryMock = {} as unknown as Repository<CampaignOrmEntity>;

    service = new SmartOfferSearchService(configServiceMock, campaignRepositoryMock);
  });

  it('should parse colloquial Arabic Mezzeh and restaurants query locally', async () => {
    // Calling internal parser directly via private member access
    const intent = await (service as any).localParseIntent('بدي عرض عشا بالمزة اليوم');

    expect(intent.category).toBe('restaurants');
    expect(intent.location).toBe('Mezzeh');
    expect(intent.availability).toBe('today');
  });

  it('should parse English clothes and Damascus query locally', async () => {
    const intent = await (service as any).localParseIntent('show me fashion offers in Damascus');

    expect(intent.category).toBe('fashion');
    expect(intent.location).toBe('Damascus');
  });
});
