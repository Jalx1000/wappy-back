import { IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** Admin request to register a brand's outbound webhook target. */
export class CreateWebhookEndpointDto {
  @ApiProperty({ description: 'HTTPS URL that will receive signed events' })
  @IsUrl({ require_tld: false }, { message: 'invalid_url' })
  url: string;
}
