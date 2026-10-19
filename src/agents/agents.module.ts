import { Module } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { AgentsController } from './agents.controller';
import { RelationalAgentPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { AnthropicAgentRuntime } from './runtime/anthropic-agent-runtime';
import { OpenAiAgentRuntime } from './runtime/openai-agent-runtime';
import { AgentRuntimeResolver } from './runtime/agent-runtime.resolver';
import { BrandsModule } from '../brands/brands.module';

// Postgres deployment (DATABASE_TYPE=postgres): relational persistence only.
// Multi-provider: Anthropic (Claude) + OpenAI (ChatGPT), picked per-agent by
// AgentRuntimeResolver. Brand-scoped via BrandGuard (x-brand-id).
@Module({
  imports: [RelationalAgentPersistenceModule, BrandsModule],
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
