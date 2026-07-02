import {
  Body,
  Controller,
  Delete,
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
import { ConnectionsService } from './connections.service';
import { AssignStrandedDto } from './dto/assign-stranded.dto';

// Connections left behind by soft-deleted brands. Like orphan-accounts this is
// cross-brand, so no BrandGuard / x-brand-id here.
@ApiTags('Connections')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'stranded-connections', version: '1' })
export class StrandedConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Get()
  list() {
    return this.connectionsService.findStranded();
  }

  @Post(':id/assign')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: Number })
  assign(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignStrandedDto,
  ) {
    return this.connectionsService.adoptStranded(id, dto.brandId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: Number })
  discard(@Param('id', ParseIntPipe) id: number) {
    return this.connectionsService.discardStranded(id);
  }
}
