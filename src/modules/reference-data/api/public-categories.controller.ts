import { Controller, Get, Version } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListActiveCategoriesService } from '../application/list-active-categories/list-active-categories.service';
import { CategoryResponseDto } from './dto/category.response';

@ApiTags('Public Categories')
@Controller('public/categories')
export class PublicCategoriesController {
  constructor(
    private readonly listActiveCategoriesService: ListActiveCategoriesService,
  ) {}

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'List active categories' })
  @ApiOkResponse({ type: CategoryResponseDto, isArray: true })
  listActive(): Promise<CategoryResponseDto[]> {
    return this.listActiveCategoriesService.listActive();
  }
}
