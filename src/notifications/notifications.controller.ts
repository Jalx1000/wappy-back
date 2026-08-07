import {
  Controller,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiQuery({ name: 'read', type: Boolean, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  async getNotifications(
    @CurrentUser() user: JwtPayloadType,
    @Query('read') read?: string,
    @Query('limit') limit?: string,
  ) {
    const pageLimit = limit ? parseInt(limit, 10) : 20;
    if (read === 'false') {
      return this.notificationsService.getUnread(Number(user.id), pageLimit);
    }
    return this.notificationsService.getByUser(Number(user.id), pageLimit);
  }

  @Patch(':id/read')
  async markAsRead(@Param('id', ParseIntPipe) id: number) {
    await this.notificationsService.markAsRead(id);
    return { success: true };
  }

  @Patch('read-all')
  async markAllAsRead(@CurrentUser() user: JwtPayloadType) {
    await this.notificationsService.markAllAsRead(Number(user.id));
    return { success: true };
  }
}
