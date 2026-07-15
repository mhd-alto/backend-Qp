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
import { ChangeCategoryStatusService } from '../application/change-category-status/change-category-status.service';
import { CreateCategoryService } from '../application/create-category/create-category.service';
import { ListAdminCategoriesService } from '../application/list-admin-categories/list-admin-categories.service';
import { UpdateCategoryService } from '../application/update-category/update-category.service';
import { CategoryStatusRequestDto } from './dto/category-status.request';
import { CategoryResponseDto } from './dto/category.response';
import { CreateCategoryRequestDto } from './dto/create-category.request';
import { UpdateCategoryRequestDto } from './dto/update-category.request';

@ApiTags('Admin Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PlatformRoleGuard)
@PlatformRoles('ADMIN')
@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(
    private readonly listAdminCategoriesService: ListAdminCategoriesService,
    private readonly createCategoryService: CreateCategoryService,
    private readonly updateCategoryService: UpdateCategoryService,
    private readonly changeCategoryStatusService: ChangeCategoryStatusService,
  ) {}

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'List all categories' })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'INACTIVE'] })
  @ApiOkResponse({ type: CategoryResponseDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  list(@Query('status') status?: 'ACTIVE' | 'INACTIVE'): Promise<CategoryResponseDto[]> {
    return this.listAdminCategoriesService.execute(status);
  }

  @Post()
  @Version('1')
  @ApiOperation({ summary: 'Create a category' })
  @ApiBody({ type: CreateCategoryRequestDto })
  @ApiCreatedResponse({ type: CategoryResponseDto })
  @ApiConflictResponse({ description: 'Category slug or Arabic sibling name already exists' })
  create(
    @Body() body: CreateCategoryRequestDto,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ): Promise<CategoryResponseDto> {
    return this.createCategoryService.execute(body, actor);
  }

  @Patch(':categoryId')
  @Version('1')
  @ApiOperation({ summary: 'Update a category' })
  @ApiBody({ type: UpdateCategoryRequestDto })
  @ApiOkResponse({ type: CategoryResponseDto })
  @ApiNotFoundResponse({ description: 'Category not found' })
  @ApiConflictResponse({ description: 'Category update conflicts with existing data' })
  update(
    @Param('categoryId') categoryId: string,
    @Body() body: UpdateCategoryRequestDto,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ): Promise<CategoryResponseDto> {
    return this.updateCategoryService.execute(categoryId, body, actor);
  }

  @Patch(':categoryId/status')
  @Version('1')
  @ApiOperation({ summary: 'Activate or deactivate a category' })
  @ApiBody({ type: CategoryStatusRequestDto })
  @ApiOkResponse({ type: CategoryResponseDto })
  @ApiNotFoundResponse({ description: 'Category not found' })
  changeStatus(
    @Param('categoryId') categoryId: string,
    @Body() body: CategoryStatusRequestDto,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ): Promise<CategoryResponseDto> {
    return this.changeCategoryStatusService.execute(categoryId, body, actor);
  }
}
