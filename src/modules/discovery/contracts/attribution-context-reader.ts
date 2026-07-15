import { AttributionContext } from '../domain/attribution/attribution-context';
import { AttributionEntryPoint } from '../domain/attribution/attribution.policy';

export const ATTRIBUTION_CONTEXT_READER = Symbol('ATTRIBUTION_CONTEXT_READER');

export interface AttributionContextReader {
  resolve(input: {
    campaignId: string;
    trackingToken?: string | null;
    entryPoint?: AttributionEntryPoint;
  }): Promise<AttributionContext>;
}
