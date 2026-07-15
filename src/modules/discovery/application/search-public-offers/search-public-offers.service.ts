import { Injectable } from '@nestjs/common';
import { PublicOfferReadRepository } from '../../infrastructure/persistence/typeorm/public-offer.read-repository';

type SearchInput = {
  query: string;
  categorySlug?: string;
  page: number;
  limit: number;
};

@Injectable()
export class SearchPublicOffersService {
  constructor(
    private readonly publicOfferReadRepository: PublicOfferReadRepository,
  ) {}

  search(input: SearchInput) {
    return this.publicOfferReadRepository.listPublicOffers({
      normalizedQuery: input.query,
      categorySlug: input.categorySlug,
      page: input.page,
      limit: input.limit,
    });
  }
}
