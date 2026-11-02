import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

/**
 * Category names detected in the external catalog (WooCommerce `product_cat`).
 * The plugin pushes the full list so every category — including ones with no
 * products yet — becomes selectable in Wappy. Upsert is by name within the
 * brand (find-or-create), so re-sending is safe.
 */
export class CreateIntegrationCategoriesDto {
  @ApiProperty({ type: [String], example: ['Didácticos', 'Peluches'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  names: string[];
}
