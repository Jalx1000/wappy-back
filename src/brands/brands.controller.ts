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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';

@ApiTags('Brands')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller({ path: 'brands', version: '1' })
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  @Roles(RoleEnum.admin, RoleEnum.agency_admin)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateBrandDto, @CurrentUser() user: JwtPayloadType) {
    return this.brandsService.create(dto, Number(user.id));
  }

  @Get()
  findAll() {
    return this.brandsService.findAll();
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.brandsService.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleEnum.admin, RoleEnum.agency_admin)
  @ApiParam({ name: 'id', type: Number })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBrandDto) {
    return this.brandsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(RoleEnum.admin, RoleEnum.agency_admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.brandsService.remove(id);
  }

  @Get(':id/members')
  @ApiParam({ name: 'id', type: Number })
  getMembers(@Param('id', ParseIntPipe) id: number) {
    return this.brandsService.getMembers(id);
  }

  @Post(':id/members')
  @Roles(RoleEnum.admin, RoleEnum.agency_admin)
  @ApiParam({ name: 'id', type: Number })
  @HttpCode(HttpStatus.CREATED)
  addMember(@Param('id', ParseIntPipe) id: number, @Body() dto: AddMemberDto) {
    return this.brandsService.addMember(
      id,
      dto.userId,
      dto.role ?? ('member' as any),
    );
  }

  @Delete(':id/members/:userId')
  @Roles(RoleEnum.admin, RoleEnum.agency_admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: Number })
  @ApiParam({ name: 'userId', type: Number })
  removeMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.brandsService.removeMember(id, userId);
  }
}
