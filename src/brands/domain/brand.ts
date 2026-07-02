import { ApiProperty } from '@nestjs/swagger';

export class Brand {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  slug: string;

  @ApiProperty({ type: String, nullable: true })
  description: string | null;

  @ApiProperty({ type: Boolean })
  isActive: boolean;

  // Stored in brand_settings.logoPath; surfaced here so every brand read
  // (list, detail, overview) carries the logo without an extra request.
  @ApiProperty({ type: String, nullable: true })
  logoPath: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true })
  deletedAt: Date | null;
}
