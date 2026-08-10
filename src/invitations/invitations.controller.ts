import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';

@ApiTags('Invitations')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller({ path: 'invitations', version: '1' })
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  // ── Admin: manage invitations ──────────────────────────────────────────────
  @Post()
  @Roles(RoleEnum.admin, RoleEnum.agency_admin)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateInvitationDto,
    @CurrentUser() user: JwtPayloadType,
  ) {
    return this.invitationsService.invite(dto, Number(user.id));
  }

  @Get()
  @Roles(RoleEnum.admin, RoleEnum.agency_admin)
  list(@Query('brandId', ParseIntPipe) brandId: number) {
    return this.invitationsService.listForBrand(brandId);
  }

  @Delete(':id')
  @Roles(RoleEnum.admin, RoleEnum.agency_admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  revoke(@Param('id') id: string) {
    return this.invitationsService.revoke(id);
  }

  // ── Invited person: view + accept ───────────────────────────────────────────
  @Get('token/:token')
  async byToken(@Param('token') token: string) {
    const invitation = await this.invitationsService.findByToken(token);
    if (!invitation) throw new NotFoundException('Invitation not found');
    return invitation;
  }

  @Post('token/:token/accept')
  accept(@Param('token') token: string, @CurrentUser() user: JwtPayloadType) {
    return this.invitationsService.accept(token, Number(user.id));
  }
}
