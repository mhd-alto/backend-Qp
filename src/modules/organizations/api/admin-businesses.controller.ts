import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Version,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { PlatformRoles } from '../../../common/decorators/platform-roles.decorator';
import { AuthenticatedPrincipal } from '../../../common/types/authenticated-principal';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { PlatformRoleGuard } from '../../auth/infrastructure/guards/platform-role.guard';
import { AddStaffMemberService } from '../application/add-staff-member/add-staff-member.service';
import { ChangeBusinessStatusService } from '../application/change-business-status/change-business-status.service';
import { ChangeMembershipStatusService } from '../application/change-membership-status/change-membership-status.service';
import { GetAdminBusinessService } from '../application/get-admin-business/get-admin-business.service';
import { ListAdminBusinessesService } from '../application/list-admin-businesses/list-admin-businesses.service';
import { ProvisionBusinessService } from '../application/provision-business/provision-business.service';
import { UpdateBusinessService } from '../application/update-business/update-business.service';
import { BusinessDetailsResponseDto, BusinessPageResponseDto } from './dto/business.dto';
import { CreateStaffRequestDto } from './dto/create-staff.request';
import { MembershipStatusRequestDto } from './dto/membership-status.request';
import { ListBusinessesQueryDto } from './dto/list-businesses.query';
import { ProvisionBusinessRequestDto } from './dto/provision-business.request';
import { StatusReasonRequestDto } from './dto/status.request';
import { UpdateBusinessRequestDto } from './dto/update-business.request';

@ApiTags('Admin Businesses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PlatformRoleGuard)
@PlatformRoles('ADMIN')
@Controller('admin/businesses')
export class AdminBusinessesController {
  constructor(
    private readonly listAdminBusinessesService: ListAdminBusinessesService,
    private readonly provisionBusinessService: ProvisionBusinessService,
    private readonly getAdminBusinessService: GetAdminBusinessService,
    private readonly updateBusinessService: UpdateBusinessService,
    private readonly changeBusinessStatusService: ChangeBusinessStatusService,
    private readonly addStaffMemberService: AddStaffMemberService,
    private readonly changeMembershipStatusService: ChangeMembershipStatusService,
  ) {}

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'List businesses' })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'SUSPENDED', 'INACTIVE'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ type: BusinessPageResponseDto })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  list(@Query() query: ListBusinessesQueryDto) {
    return this.listAdminBusinessesService.execute(
      query.status,
      query.page,
      query.limit,
    );
  }

  @Post()
  @Version('1')
  @ApiOperation({ summary: 'Provision a business, primary branch, owner and staff' })
  @ApiBody({ type: ProvisionBusinessRequestDto })
  @ApiCreatedResponse({ type: BusinessDetailsResponseDto })
  @ApiConflictResponse({ description: 'Business, identity, or membership conflict' })
  create(
    @Body() body: ProvisionBusinessRequestDto,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ) {
    return this.provisionBusinessService.execute(body, actor);
  }

  @Get(':businessId')
  @Version('1')
  @ApiOperation({ summary: 'Get business details' })
  @ApiOkResponse({ type: BusinessDetailsResponseDto })
  @ApiNotFoundResponse({ description: 'Business not found' })
  getById(@Param('businessId') businessId: string) {
    return this.getAdminBusinessService.execute(businessId);
  }

  @Patch(':businessId')
  @Version('1')
  @ApiOperation({ summary: 'Update business profile' })
  @ApiBody({ type: UpdateBusinessRequestDto })
  @ApiOkResponse({ type: BusinessDetailsResponseDto })
  @ApiNotFoundResponse({ description: 'Business not found' })
  update(
    @Param('businessId') businessId: string,
    @Body() body: UpdateBusinessRequestDto,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ) {
    return this.updateBusinessService.execute(businessId, body, actor);
  }

  @Patch(':businessId/status')
  @Version('1')
  @ApiOperation({ summary: 'Suspend, reactivate or deactivate a business' })
  @ApiBody({ type: StatusReasonRequestDto })
  @ApiOkResponse({ type: BusinessDetailsResponseDto })
  changeStatus(
    @Param('businessId') businessId: string,
    @Body() body: StatusReasonRequestDto,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ) {
    return this.changeBusinessStatusService.execute(businessId, body, actor);
  }

  @Post(':businessId/staff')
  @Version('1')
  @ApiOperation({ summary: 'Add a staff account to the primary branch' })
  @ApiBody({ type: CreateStaffRequestDto })
  @ApiCreatedResponse({ type: BusinessDetailsResponseDto })
  addStaff(
    @Param('businessId') businessId: string,
    @Body() body: CreateStaffRequestDto,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ) {
    return this.addStaffMemberService.execute(businessId, body, actor);
  }

  @Patch(':businessId/members/:membershipId/status')
  @Version('1')
  @ApiOperation({ summary: 'Update business membership status' })
  @ApiBody({ type: MembershipStatusRequestDto })
  @ApiOkResponse({ type: BusinessDetailsResponseDto })
  changeMembershipStatus(
    @Param('businessId') businessId: string,
    @Param('membershipId') membershipId: string,
    @Body() body: MembershipStatusRequestDto,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ) {
    return this.changeMembershipStatusService.execute(
      businessId,
      membershipId,
      body,
      actor,
    );
  }
}
