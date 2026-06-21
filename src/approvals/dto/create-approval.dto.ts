import { IsNumber, IsOptional } from 'class-validator';

export class CreateApprovalDto {
  @IsNumber()
  assetId: number;

  // When set, approving this record schedules the linked calendar publication.
  @IsOptional()
  @IsNumber()
  calendarItemId?: number;
}
