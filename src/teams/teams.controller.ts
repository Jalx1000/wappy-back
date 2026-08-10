import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@ApiTags('Teams')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller({ path: 'teams', version: '1' })
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @Roles(RoleEnum.admin, RoleEnum.agency_admin)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateTeamDto) {
    return this.teamsService.create(dto);
  }

  @Get()
  list(@Query('brandId', ParseIntPipe) brandId: number) {
    return this.teamsService.listForBrand(brandId);
  }

  @Patch(':id')
  @Roles(RoleEnum.admin, RoleEnum.agency_admin)
  rename(@Param('id') id: string, @Body() dto: UpdateTeamDto) {
    return this.teamsService.rename(id, dto.name);
  }

  @Delete(':id')
  @Roles(RoleEnum.admin, RoleEnum.agency_admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.teamsService.remove(id);
  }

  @Post(':id/members')
  @Roles(RoleEnum.admin, RoleEnum.agency_admin)
  addMember(@Param('id') id: string, @Body() dto: AddTeamMemberDto) {
    return this.teamsService.addMember(id, dto.userId);
  }

  @Delete(':id/members/:userId')
  @Roles(RoleEnum.admin, RoleEnum.agency_admin)
  removeMember(
    @Param('id') id: string,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.teamsService.removeMember(id, userId);
  }
}
