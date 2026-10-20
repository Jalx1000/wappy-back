import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiHeader, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { memoryStorage } from 'multer';
import { BrandGuard } from '../brands/guards/brand.guard';
import { CurrentBrand } from '../brands/decorators/current-brand.decorator';
import { Brand } from '../brands/domain/brand';
import { SocialInboxService } from './social-inbox.service';
import { WhatsappMediaService } from './whatsapp-media.service';
import { SendMessageDto } from './dto/send-message.dto';
import { SendLocationDto } from './dto/send-location.dto';
import { SendMediaDto } from './dto/send-media.dto';
import { AssignConversationDto } from './dto/assign-conversation.dto';
import { SubmitRatingDto } from './dto/submit-rating.dto';
import { SetStatusDto } from './dto/set-status.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';

@ApiTags('Social Inbox')
@ApiBearerAuth()
@ApiHeader({ name: 'x-brand-id', required: true })
@UseGuards(AuthGuard('jwt'), BrandGuard)
@Controller({ path: 'social-inbox', version: '1' })
export class SocialInboxController {
  constructor(
    private readonly service: SocialInboxService,
    private readonly mediaService: WhatsappMediaService,
  ) {}

  @Get('media/:messageId')
  async media(
    @CurrentBrand() brand: Brand,
    @Param('messageId') messageId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { buffer, mimeType, filename } = await this.mediaService.fetch(
      brand.id,
      messageId,
    );
    res.set({
      'Content-Type': mimeType,
      'Cache-Control': 'private, max-age=3600',
      ...(filename
        ? { 'Content-Disposition': `inline; filename="${filename}"` }
        : {}),
    });
    return new StreamableFile(buffer);
  }

  @Get('accounts')
  listAccounts(@CurrentBrand() brand: Brand) {
    return this.service.listAccounts(brand.id);
  }

  @Get('metrics')
  @ApiQuery({
    name: 'from',
    required: false,
    description: 'ISO date (inclusive)',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    description: 'ISO date (inclusive)',
  })
  metrics(
    @CurrentBrand() brand: Brand,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.conversationMetrics(brand.id, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('conversations')
  @ApiQuery({ name: 'channel', required: false })
  @ApiQuery({ name: 'connectionId', required: false, type: Number })
  listConversations(
    @CurrentBrand() brand: Brand,
    @Query('channel') channel?: string,
    @Query('connectionId') connectionId?: string,
  ) {
    return this.service.listConversations(brand.id, {
      channel: channel || undefined,
      connectionId: connectionId ? parseInt(connectionId, 10) : undefined,
    });
  }

  @Get('conversations/:id/messages')
  @ApiQuery({ name: 'channel', required: true })
  listMessages(
    @CurrentBrand() brand: Brand,
    @Param('id') id: string,
    @Query('channel') channel: string,
  ) {
    return this.service.listMessages(brand.id, id, channel);
  }

  @Post('conversations/:id/messages')
  sendMessage(
    @CurrentBrand() brand: Brand,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.service.sendMessage(brand.id, id, dto.channel, dto.text);
  }

  @Patch('conversations/:id/assignment')
  assign(
    @CurrentBrand() brand: Brand,
    @Param('id') id: string,
    @Body() dto: AssignConversationDto,
  ) {
    return this.service.assign(brand.id, id, dto.channel, {
      assigneeUserId: dto.assigneeUserId,
      teamId: dto.teamId,
    });
  }

  @Patch('conversations/:id/status')
  setStatus(
    @CurrentBrand() brand: Brand,
    @CurrentUser() user: JwtPayloadType,
    @Param('id') id: string,
    @Body() dto: SetStatusDto,
  ) {
    const userId = user?.id != null ? Number(user.id) : null;
    return this.service.setConversationStatus(
      brand.id,
      id,
      dto.channel,
      dto.status,
      userId,
    );
  }

  @Post('conversations/:id/rating')
  submitRating(
    @CurrentBrand() brand: Brand,
    @Param('id') id: string,
    @Body() dto: SubmitRatingDto,
  ) {
    return this.service.submitRating(brand.id, id, {
      channel: dto.channel,
      score: dto.score,
      comment: dto.comment,
    });
  }

  @Post('conversations/:id/location')
  sendLocation(
    @CurrentBrand() brand: Brand,
    @Param('id') id: string,
    @Body() dto: SendLocationDto,
  ) {
    return this.service.sendLocation(brand.id, id, dto.channel, {
      latitude: dto.latitude,
      longitude: dto.longitude,
      name: dto.name,
      address: dto.address,
    });
  }

  @Post('conversations/:id/media')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  sendMedia(
    @CurrentBrand() brand: Brand,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: SendMediaDto,
  ) {
    if (!file) throw new BadRequestException('file is required');
    return this.service.sendMedia(
      brand.id,
      id,
      dto.channel,
      {
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalname: file.originalname,
      },
      dto.caption,
    );
  }
}
