import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { FileStorageService } from './file-storage.service';

/**
 * Serves stored media/avatars by File id with a stable, permanent URL. Public
 * (no auth) so it can back an <img>/<video> src directly — the id is an
 * unguessable uuid. Bytes are read from whatever driver stored them (local disk
 * or S3), so the url never expires (unlike Meta CDN or S3 presigned urls).
 */
@ApiTags('Files')
@Controller({ path: 'media-file', version: '1' })
export class MediaFileController {
  constructor(private readonly storage: FileStorageService) {}

  @Get(':id')
  async serve(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const data = await this.storage.readById(id);
    if (!data) {
      throw new NotFoundException('File not found');
    }
    res.set({
      'Content-Type': data.mime,
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
    res.end(data.buffer);
  }
}
