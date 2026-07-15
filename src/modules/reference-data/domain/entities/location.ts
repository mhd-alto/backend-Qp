export type LocationStatus = 'ACTIVE' | 'INACTIVE';

export type LocationType = 'COUNTRY' | 'GOVERNORATE' | 'CITY' | 'AREA';

export type Location = {
  id: string;
  parentId: string | null;
  type: LocationType;
  nameAr: string;
  nameEn: string | null;
  slug: string;
  status: LocationStatus;
  createdAt: Date;
  updatedAt: Date;
};
