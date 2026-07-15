import { AttributionSourceType } from './attribution-source-type';

export const ATTRIBUTION_ENTRY_POINTS = [
  'DIRECT',
  'COUPONHUB_SEARCH',
  'TRACKING_LINK',
] as const;

export type AttributionEntryPoint = (typeof ATTRIBUTION_ENTRY_POINTS)[number];

export class AttributionPolicy {
  static resolveFallbackSourceType(
    entryPoint: AttributionEntryPoint,
  ): Extract<AttributionSourceType, 'DIRECT' | 'COUPONHUB_SEARCH'> {
    return entryPoint === 'COUPONHUB_SEARCH' ? 'COUPONHUB_SEARCH' : 'DIRECT';
  }
}
