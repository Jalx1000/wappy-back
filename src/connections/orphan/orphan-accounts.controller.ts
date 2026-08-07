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
import { OrphanAccountsService } from './orphan-accounts.service';
import { AssignOrphanDto } from './dto/assign-orphan.dto';

@ApiTags('Connections')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'orphan-accounts', version: '1' })
export class OrphanAccountsController {
  constructor(private readonly orphansService: OrphanAccountsService) {}

  @Get()
  list() {
    return this.orphansService.listAll();
  }

  @Post(':id/assign')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: Number })
  assign(@Param('id', ParseIntPipe) id: number, @Body() dto: AssignOrphanDto) {
    return this.orphansService.assignToBrand(id, dto.brandId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: Number })
  discard(@Param('id', ParseIntPipe) id: number) {
    return this.orphansService.discard(id);
  }
}
