import { Injectable } from '@nestjs/common';
import { ListPublicOffersQueryDto } from '../../api/dto/public-offer.query';
import { OfferPageResponseDto } from '../../api/dto/public-offer.response';
import { PublicOfferReadRepository } from '../../infrastructure/persistence/typeorm/public-offer.read-repository';
import { SearchPublicOffersService } from '../search-public-offers/search-public-offers.service';

@Injectable()
export class ListPublicOffersService {
  constructor(
    private readonly publicOfferReadRepository: PublicOfferReadRepository,
    private readonly searchPublicOffersService: SearchPublicOffersService,
  ) {}

  async list(query: ListPublicOffersQueryDto): Promise<OfferPageResponseDto> {
    const normalizedQuery = this.normalizeQuery(query.q);
    const categorySlug = query.category?.trim() || undefined;

    if (categorySlug) {
      const categoryExists =
        await this.publicOfferReadRepository.isActiveCategorySlug(categorySlug);

      if (!categoryExists) {
        return {
          items: [],
          meta: {
            page: query.page,
            limit: query.limit,
            total: 0,
            pageCount: 1,
          },
        };
      }
    }

    const result = normalizedQuery
      ? await this.searchPublicOffersService.search({
          query: normalizedQuery,
          categorySlug,
          page: query.page,
          limit: query.limit,
        })
      : await this.publicOfferReadRepository.listPublicOffers({
          categorySlug,
          page: query.page,
          limit: query.limit,
        });

    return {
      items: result.items,
      meta: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        pageCount: Math.max(1, Math.ceil(result.total / query.limit)),
      },
    };
  }

  private normalizeQuery(query?: string): string | undefined {
    const normalized = query?.trim().replace(/\s+/g, ' ');
    return normalized ? normalized : undefined;
  }
}
