import { ApiProperty } from '@nestjs/swagger';

export class Agent {
  @ApiProperty({
    type: () => Number,
    nullable: false,
  })
  brandId?: number;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  name?: string;

  @ApiProperty({
    type: () => Boolean,
    nullable: false,
  })
  enabled?: boolean;

  @ApiProperty({
    type: () => String,
    nullable: false,
    description: 'Claude model id, e.g. claude-sonnet-4-6',
  })
  model?: string;

  @ApiProperty({
    type: () => String,
    nullable: true,
    description: 'System prompt / persona that drives the agent.',
  })
  systemPrompt?: string | null;

  @ApiProperty({
    type: () => String,
    nullable: true,
    description: 'Optional effort hint (low|medium|high).',
  })
  effort?: string | null;

  @ApiProperty({
    type: () => [String],
    nullable: true,
    description: 'Names of the tools enabled for this agent.',
  })
  toolsEnabled?: string[] | null;

  @ApiProperty({
    type: String,
  })
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
