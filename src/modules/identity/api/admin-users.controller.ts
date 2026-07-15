import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
  Version,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
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
import { ListAdminUsersService } from '../application/list-admin-users/list-admin-users.service';
import { SetUserStatusService } from '../application/set-user-status/set-user-status.service';
import { AdminUserPageResponseDto } from './dto/admin-user-page.response';
import { ListAdminUsersQueryDto } from './dto/list-admin-users.query';
import { UserStatusRequestDto } from './dto/user-status.request';
import { UserSummaryResponseDto } from './dto/user-summary.response';

@ApiTags('Admin Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PlatformRoleGuard)
@PlatformRoles('ADMIN')
@Controller('admin/users')
export class AdminUsersController {
  constructor(
    private readonly listAdminUsersService: ListAdminUsersService,
    private readonly setUserStatusService: SetUserStatusService,
  ) {}

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'List users' })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'SUSPENDED', 'INACTIVE'] })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ type: AdminUserPageResponseDto })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  list(@Query() query: ListAdminUsersQueryDto): Promise<AdminUserPageResponseDto> {
    return this.listAdminUsersService.execute(query);
  }

  @Patch(':userId/status')
  @Version('1')
  @ApiOperation({ summary: 'Suspend or reactivate a user' })
  @ApiBody({ type: UserStatusRequestDto })
  @ApiOkResponse({ type: UserSummaryResponseDto })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async setUserStatus(
    @Param('userId') userId: string,
    @Body() body: UserStatusRequestDto,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ): Promise<UserSummaryResponseDto> {
    return this.setUserStatusService.execute(userId, body, actor);
  }
}
