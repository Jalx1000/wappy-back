import { IsNumber } from 'class-validator';

export class CreateApprovalDto {
  @IsNumber()
  assetId: number;
}
