export type CategoryStatus = 'ACTIVE' | 'INACTIVE';

export type Category = {
  id: string;
  parentId: string | null;
  nameAr: string;
  nameEn: string | null;
  slug: string;
  iconUrl: string | null;
  sortOrder: number;
  status: CategoryStatus;
  createdAt: Date;
  updatedAt: Date;
};
