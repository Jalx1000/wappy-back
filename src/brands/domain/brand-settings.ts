import { ApiProperty } from '@nestjs/swagger';

export class BrandSettings {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Number })
  brandId: number;

  @ApiProperty({ type: String, nullable: true })
  primaryColor: string | null;

  @ApiProperty({ type: String, nullable: true })
  secondaryColor: string | null;

  @ApiProperty({ type: String, nullable: true })
  logoPath: string | null;

  @ApiProperty({ type: String, nullable: true })
  customDomain: string | null;

  @ApiProperty({ type: String, nullable: true })
  contactEmail: string | null;

  @ApiProperty({ type: String, nullable: true })
  customCss: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
