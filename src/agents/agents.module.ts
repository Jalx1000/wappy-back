import { Module } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { AgentsController } from './agents.controller';
import { RelationalAgentPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { AgentRuntime } from './runtime/agent-runtime';
import { AnthropicAgentRuntime } from './runtime/anthropic-agent-runtime';

// Postgres deployment (DATABASE_TYPE=postgres): relational persistence only.
// A document variant can be added later mirroring other modules if needed.
@Module({
  imports: [RelationalAgentPersistenceModule],
  controllers: [AgentsController],
  providers: [
    AgentsService,
    {
      provide: AgentRuntime,
      useClass: AnthropicAgentRuntime,
    },
  ],
  exports: [AgentsService, RelationalAgentPersistenceModule],
})
export class AgentsModule {}
