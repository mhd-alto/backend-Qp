import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocationReader } from '../../../../contracts/location-reader';
import { Location } from '../../../../domain/entities/location';
import { LocationOrmEntity } from '../entities/location.orm-entity';

@Injectable()
export class LocationReadRepository implements LocationReader {
  constructor(
    @InjectRepository(LocationOrmEntity)
    private readonly repository: Repository<LocationOrmEntity>,
  ) {}

  async findById(id: string): Promise<Location | null> {
    const entity = await this.repository.findOne({ where: { id } });

    if (!entity) {
      return null;
    }

    return {
      id: entity.id,
      parentId: entity.parentId,
      type: entity.type as Location['type'],
      nameAr: entity.nameAr,
      nameEn: entity.nameEn,
      slug: entity.slug,
      status: entity.status as Location['status'],
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
