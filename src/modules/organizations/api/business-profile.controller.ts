import { Controller, Get, UseGuards, Version } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedPrincipal } from '../../../common/types/authenticated-principal';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { GetBusinessProfileService } from '../application/get-business-profile/get-business-profile.service';
import { BusinessDetailsResponseDto } from './dto/business.dto';

@ApiTags('Business Profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('business/profile')
export class BusinessProfileController {
  constructor(
    private readonly getBusinessProfileService: GetBusinessProfileService,
  ) {}

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'Get current manager business profile' })
  @ApiOkResponse({ type: BusinessDetailsResponseDto })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Owner access required' })
  getCurrentBusiness(@CurrentUser() actor: AuthenticatedPrincipal) {
    return this.getBusinessProfileService.execute(actor);
  }
}
