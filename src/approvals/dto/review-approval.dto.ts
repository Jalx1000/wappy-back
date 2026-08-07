import { IsString, IsOptional, IsArray } from 'class-validator';
import { Annotation } from '../domain/approval';

export class ReviewApprovalDto {
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsArray()
  annotations?: Annotation[];
}
