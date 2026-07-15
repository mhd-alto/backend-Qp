import { Injectable } from '@nestjs/common';
import { AuthenticatedPrincipal } from '../../../../common/types/authenticated-principal';
import { CreateStaffRequestDto } from '../../api/dto/create-staff.request';
import { ProvisionBusinessService } from '../provision-business/provision-business.service';

@Injectable()
export class AddStaffMemberService {
  constructor(
    private readonly provisionBusinessService: ProvisionBusinessService,
  ) {}

  execute(
    businessId: string,
    body: CreateStaffRequestDto,
    actor: AuthenticatedPrincipal,
  ) {
    return this.provisionBusinessService.createStaff(businessId, body, actor);
  }
}
