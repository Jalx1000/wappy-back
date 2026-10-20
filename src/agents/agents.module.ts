import { Module } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { AgentsController } from './agents.controller';
import { RelationalAgentPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { AnthropicAgentRuntime } from './runtime/anthropic-agent-runtime';
import { OpenAiAgentRuntime } from './runtime/openai-agent-runtime';
import { AgentRuntimeResolver } from './runtime/agent-runtime.resolver';
import { BrandsModule } from '../brands/brands.module';
import { ProductsModule } from '../products/products.module';
import { ContactsModule } from '../contacts/contacts.module';
import { GetProductsTool } from './tools/get-products.tool';
import { GetCustomerTool } from './tools/get-customer.tool';
import { AgentToolRegistry } from './tools/agent-tool.registry';

// Postgres deployment (DATABASE_TYPE=postgres): relational persistence only.
// Multi-provider: Anthropic (Claude) + OpenAI (ChatGPT), picked per-agent by
// AgentRuntimeResolver. Brand-scoped via BrandGuard (x-brand-id).
// Tools (get_products/get_customer) are selected per-agent via toolsEnabled.
@Module({
  imports: [
    RelationalAgentPersistenceModule,
    BrandsModule,
    ProductsModule,
    ContactsModule,
  ],
  controllers: [AgentsController],
  providers: [
    AgentsService,
    AnthropicAgentRuntime,
    OpenAiAgentRuntime,
    AgentRuntimeResolver,
    GetProductsTool,
    GetCustomerTool,
    AgentToolRegistry,
  ],
  exports: [AgentsService, RelationalAgentPersistenceModule],
})
export class AgentsModule {}
