import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

export class PublicOfferQueryBuilder {
  static applyListVisibility<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    now: Date,
  ) {
    return query
      .where('campaign.deleted_at IS NULL')
      .andWhere('business.deleted_at IS NULL')
      .andWhere(`business.status = 'ACTIVE'`)
      .andWhere(`campaign.status = 'ACTIVE'`)
      .andWhere('campaign.is_searchable = true')
      .andWhere('campaign.start_at <= :now', { now })
      .andWhere('campaign.end_at >= :now', { now });
  }

  static applyDetailVisibility<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
  ) {
    return query
      .where('campaign.deleted_at IS NULL')
      .andWhere('business.deleted_at IS NULL')
      .andWhere(`business.status = 'ACTIVE'`)
      .andWhere(`campaign.status IN ('SCHEDULED', 'ACTIVE', 'EXPIRED', 'SUSPENDED')`);
  }
}
