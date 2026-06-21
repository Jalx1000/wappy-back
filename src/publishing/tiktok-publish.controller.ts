import {
  BadRequestException,
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
import { ApiBearerAuth, ApiHeader, ApiParam, ApiTags } from '@nestjs/swagger';
import { BrandGuard } from '../brands/guards/brand.guard';
import { CurrentBrand } from '../brands/decorators/current-brand.decorator';
import { Brand } from '../brands/domain/brand';
import { ConnectionsService } from '../connections/connections.service';
import { ChannelEnum } from '../connections/domain/channel.enum';
import { EncryptionService } from '../encryption/encryption.service';
import {
  TiktokPublishService,
  TiktokPrivacyLevel,
} from '../channel-providers/providers/tiktok/tiktok-publish.service';
import { MediaResolverService } from './media-resolver.service';
import { PublishMode, PublishTiktokDto, TiktokPrivacy } from './dto/publish-tiktok.dto';

@ApiTags('Publishing')
@ApiBearerAuth()
@ApiHeader({ name: 'x-brand-id', required: true })
@UseGuards(AuthGuard('jwt'), BrandGuard)
@Controller({ path: 'publishing/tiktok', version: '1' })
export class TiktokPublishController {
  constructor(
    private readonly connectionsService: ConnectionsService,
    private readonly encryption: EncryptionService,
    private readonly media: MediaResolverService,
    private readonly tiktokPublish: TiktokPublishService,
  ) {}

  @Get(':connectionId/creator-info')
  @ApiParam({ name: 'connectionId', type: Number })
  async creatorInfo(
    @CurrentBrand() brand: Brand,
    @Param('connectionId', ParseIntPipe) connectionId: number,
  ) {
    const token = await this.tokenFor(brand.id, connectionId);
    return this.tiktokPublish.queryCreatorInfo(token);
  }

  @Post(':connectionId/publish')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiParam({ name: 'connectionId', type: Number })
  async publish(
    @CurrentBrand() brand: Brand,
    @Param('connectionId', ParseIntPipe) connectionId: number,
    @Body() dto: PublishTiktokDto,
  ) {
    const token = await this.tokenFor(brand.id, connectionId);
    const media = await this.media.resolveAsset(dto.assetId, brand.id);

    const postInfo =
      dto.mode === PublishMode.direct
        ? {
            title: dto.title,
            privacyLevel: (dto.privacyLevel ??
              TiktokPrivacy.SELF_ONLY) as unknown as TiktokPrivacyLevel,
            disableComment: dto.disableComment,
            disableDuet: dto.disableDuet,
            disableStitch: dto.disableStitch,
          }
        : undefined;

    return this.tiktokPublish.publishVideo(
      token,
      { buffer: media.buffer, mimeType: media.mimeType },
      { mode: dto.mode, postInfo },
    );
  }

  @Get(':connectionId/status/:publishId')
  @ApiParam({ name: 'connectionId', type: Number })
  @ApiParam({ name: 'publishId', type: String })
  async status(
    @CurrentBrand() brand: Brand,
    @Param('connectionId', ParseIntPipe) connectionId: number,
    @Param('publishId') publishId: string,
  ) {
    const token = await this.tokenFor(brand.id, connectionId);
    return this.tiktokPublish.fetchStatus(token, publishId);
  }

  // Brand-scoped lookup + token decryption. ConnectionsService.findOne enforces
  // the connection belongs to the brand and returns the encrypted token.
  private async tokenFor(
    brandId: number,
    connectionId: number,
  ): Promise<string> {
    const conn = await this.connectionsService.findOne(brandId, connectionId);
    if (conn.channel !== ChannelEnum.tiktok) {
      throw new BadRequestException(
        'Connection is not a TikTok organic account',
      );
    }
    try {
      return this.encryption.decrypt(conn.accessToken);
    } catch {
      return conn.accessToken;
    }
  }
}
