import { PartialType } from '@nestjs/swagger';
import { CreateCategoryRequestDto } from './create-category.request';

export class UpdateCategoryRequestDto extends PartialType(CreateCategoryRequestDto) {}
