import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class SubmitRatingDto {
  @ApiProperty({ example: 'whatsapp' })
  @IsString()
  channel: string;

  @ApiProperty({ minimum: 1, maximum: 5, example: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  score: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  comment?: string | null;
}
