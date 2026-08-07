import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  Query,
  Post,
  Headers,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiHeader, ApiQuery, ApiTags } from '@nestjs/swagger';
import { BrandGuard } from '../brands/guards/brand.guard';
import { CurrentBrand } from '../brands/decorators/current-brand.decorator';
import { Brand } from '../brands/domain/brand';
import { InboxService } from './inbox.service';

@ApiTags('Inbox')
@ApiBearerAuth()
@ApiHeader({ name: 'x-brand-id', required: true })
@UseGuards(AuthGuard('jwt'), BrandGuard)
@Controller({ path: 'inbox', version: '1' })
export class InboxController {
  constructor(private readonly inboxService: InboxService) {}

  @Get()
  @ApiQuery({ name: 'status', type: String, required: false })
  @ApiQuery({ name: 'channel', type: String, required: false })
  @ApiQuery({ name: 'type', type: String, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  async getMessages(
    @CurrentBrand() brand: Brand,
    @Query('status') status?: string,
    @Query('channel') channel?: string,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
  ) {
    const pageLimit = limit ? parseInt(limit, 10) : 20;
    return this.inboxService.getByBrand(
      brand.id,
      status,
      channel,
      type,
      pageLimit,
    );
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { status: string },
  ) {
    await this.inboxService.updateMessageStatus(id, dto.status);
    return { success: true };
  }

  @Post('webhook/meta')
  async handleMetaWebhook(
    @Body() payload: any,
    @Headers('x-hub-signature-256') signature: string,
  ) {
    if (signature) {
      const cleanSig = signature.replace('sha256=', '');
      await this.inboxService.handleMetaWebhook(payload, cleanSig);
    }
    return { status: 'ok' };
  }
}
