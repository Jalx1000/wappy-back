import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DiscoveryAssignmentDto {
  @ApiProperty({ example: 'properties/123456789' })
  @IsString()
  accountId: string;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'brandId to assign, or null to send to orphan tray',
    example: 10,
  })
  @IsOptional()
  @IsInt()
  brandId: number | null;
}

export class AssignDiscoveryDto {
  @ApiProperty({ type: [DiscoveryAssignmentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiscoveryAssignmentDto)
  assignments: DiscoveryAssignmentDto[];
}
