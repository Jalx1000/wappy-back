import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

// User-editable contact fields from the Contacts UI. Deliberately excludes
// brandId and mergedIntoContactId so a client cannot reassign or tombstone a
// contact through the edit form.
export class UpdateContactProfileDto {
  @ApiPropertyOptional({ type: () => String, nullable: true })
  @IsOptional()
  @IsString()
  displayName?: string | null;

  @ApiPropertyOptional({ type: () => String, nullable: true })
  @IsOptional()
  @IsString()
  phone?: string | null;

  @ApiPropertyOptional({ type: () => String, nullable: true })
  @IsOptional()
  @IsString()
  email?: string | null;

  @ApiPropertyOptional({ type: () => String, nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiPropertyOptional({ type: () => String, nullable: true })
  @IsOptional()
  @IsString()
  avatarUrl?: string | null;
}
