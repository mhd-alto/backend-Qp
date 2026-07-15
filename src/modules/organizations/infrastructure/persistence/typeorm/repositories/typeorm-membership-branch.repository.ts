import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { MembershipBranchRepository } from '../../../../domain/repositories/membership-branch.repository';
import { MembershipBranchOrmEntity } from '../entities/membership-branch.orm-entity';

@Injectable()
export class TypeOrmMembershipBranchRepository
  implements MembershipBranchRepository
{
  constructor(
    @InjectRepository(MembershipBranchOrmEntity)
    private readonly repository: Repository<MembershipBranchOrmEntity>,
  ) {}

  async assignToBranch(
    membershipId: string,
    branchId: string,
    businessId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = this.getRepository(manager);
    await repository.save(
      repository.create({
        membershipId,
        branchId,
        businessId,
      }),
    );
  }

  private getRepository(
    manager?: EntityManager,
  ): Repository<MembershipBranchOrmEntity> {
    return manager ? manager.getRepository(MembershipBranchOrmEntity) : this.repository;
  }
}
