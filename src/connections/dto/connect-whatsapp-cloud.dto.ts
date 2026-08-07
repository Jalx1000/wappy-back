import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

// Manual Cloud API onboarding (pre-coexistence): the customer pastes their
// WhatsApp Cloud API credentials so we can create the connection, send, and
// (best-effort) subscribe our app to their WABA so webhooks flow.
export class ConnectWhatsappCloudDto {
  @ApiProperty({ example: '106540352242922' })
  @IsString()
  @IsNotEmpty()
  phoneNumberId: string;

  @ApiProperty({ example: '102290129340398' })
  @IsString()
  @IsNotEmpty()
  wabaId: string;

  @ApiProperty({ description: 'Permanent or system-user access token' })
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  appId?: string;

  @ApiPropertyOptional({ example: 'Mi Negocio' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ example: '+591 70000000' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'Service' })
  @IsOptional()
  @IsString()
  category?: string;
}
