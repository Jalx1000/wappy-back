import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

// Result of the Embedded Signup (coexistence) flow, sent from the front:
// `code` from FB.login + waba_id/phone_number_id from the session-logging event.
export class OnboardCoexistenceDto {
  @ApiProperty({ description: 'Exchangeable token code from Embedded Signup' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: '102290129340398' })
  @IsString()
  @IsNotEmpty()
  wabaId: string;

  @ApiPropertyOptional({ example: '106540352242922' })
  @IsOptional()
  @IsString()
  phoneNumberId?: string;
}
