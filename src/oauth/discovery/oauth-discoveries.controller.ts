import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtPayloadType } from '../../auth/strategies/types/jwt-payload.type';
import { OAuthDiscoveriesService } from './oauth-discoveries.service';
import { AssignDiscoveryDto } from './dto/assign-discovery.dto';

@ApiTags('OAuth')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'oauth-discoveries', version: '1' })
export class OAuthDiscoveriesController {
  constructor(private readonly discoveriesService: OAuthDiscoveriesService) {}

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  async getOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayloadType,
  ) {
    const d = await this.discoveriesService.getForUser(id, Number(user.id));
    return this.discoveriesService.toPublicView(d);
  }

  @Post(':id/assign')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: Number })
  async assign(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignDiscoveryDto,
    @CurrentUser() user: JwtPayloadType,
  ) {
    return this.discoveriesService.assign(id, Number(user.id), dto.assignments);
  }
}
