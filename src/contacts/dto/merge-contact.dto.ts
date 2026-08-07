import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

// Merge another contact (`loserId`) into the contact addressed in the URL.
// The loser's identities are reparented onto the survivor and the loser is
// tombstoned (mergedIntoContactId → survivor).
export class MergeContactDto {
  @ApiProperty({ type: () => String })
  @IsString()
  @IsNotEmpty()
  loserId: string;
}
