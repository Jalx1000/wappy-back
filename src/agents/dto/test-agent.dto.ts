import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class TestAgentDto {
  @ApiProperty({
    description: 'Message to send to the agent in the test console.',
  })
  @IsString()
  message: string;
}
