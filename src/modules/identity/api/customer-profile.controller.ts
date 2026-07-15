import { Controller, Get, UseGuards, Version } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedPrincipal } from '../../../common/types/authenticated-principal';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { CurrentUserResponseDto } from './dto/current-user.response';

@ApiTags('Identity')
@ApiBearerAuth()
@Controller('users')
export class CustomerProfileController {
  @Get('me')
  @Version('1')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ type: CurrentUserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  getCurrentUser(
    @CurrentUser() user: AuthenticatedPrincipal,
  ): CurrentUserResponseDto {
    return user;
  }
}
