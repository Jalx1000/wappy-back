import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

// Multipart body (the file is @UploadedFile); these are the accompanying fields.
export class SendMediaDto {
  @ApiProperty({ example: 'whatsapp' })
  @IsString()
  @IsNotEmpty()
  channel: string;

  @ApiPropertyOptional({ description: 'Caption (image/video/document only)' })
  @IsOptional()
  @IsString()
  caption?: string;
}
