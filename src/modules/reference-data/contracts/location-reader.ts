import { Location } from '../domain/entities/location';

export const LOCATION_READER = Symbol('LOCATION_READER');

export interface LocationReader {
  findById(id: string): Promise<Location | null>;
}
