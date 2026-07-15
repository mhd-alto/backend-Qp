export const ATTRIBUTION_SOURCE_TYPES = [
  'DIRECT',
  'COUPONHUB_SEARCH',
  'FACEBOOK',
  'INSTAGRAM',
  'WHATSAPP',
  'INFLUENCER',
  'PAID_AD',
  'OTHER',
] as const;

export type AttributionSourceType = (typeof ATTRIBUTION_SOURCE_TYPES)[number];
