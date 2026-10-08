import { Module } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { AgentsController } from './agents.controller';
import { RelationalAgentPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { AnthropicAgentRuntime } from './runtime/anthropic-agent-runtime';
import { OpenAiAgentRuntime } from './runtime/openai-agent-runtime';
import { AgentRuntimeResolver } from './runtime/agent-runtime.resolver';

// Postgres deployment (DATABASE_TYPE=postgres): relational persistence only.
// A document variant can be added later mirroring other modules if needed.
// Multi-provider: Anthropic (Claude) + OpenAI (ChatGPT), picked per-agent by
// AgentRuntimeResolver based on Agent.provider.
@Module({
  imports: [RelationalAgentPersistenceModule],
  controllers: [AgentsController],
  providers: [
    AgentsService,
    AnthropicAgentRuntime,
    OpenAiAgentRuntime,
    AgentRuntimeResolver,
  ],
  exports: [AgentsService, RelationalAgentPersistenceModule],
})
export class AgentsModule {}
