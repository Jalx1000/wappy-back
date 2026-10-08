import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { AgentRepository } from './infrastructure/persistence/agent.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { Agent } from './domain/agent';
import { AgentRuntimeResult } from './runtime/agent-runtime';
import { AgentRuntimeResolver } from './runtime/agent-runtime.resolver';

const DEFAULT_MODEL_BY_PROVIDER: Record<string, string> = {
  anthropic: 'claude-sonnet-4-6',
  openai: 'gpt-4o-mini',
};

@Injectable()
export class AgentsService {
  constructor(
    private readonly agentRepository: AgentRepository,
    private readonly runtimes: AgentRuntimeResolver,
  ) {}

  create(createAgentDto: CreateAgentDto) {
    const provider = createAgentDto.provider ?? 'anthropic';
    return this.agentRepository.create({
      brandId: createAgentDto.brandId,
      name: createAgentDto.name,
      enabled: createAgentDto.enabled ?? false,
      provider,
      model:
        createAgentDto.model ??
        DEFAULT_MODEL_BY_PROVIDER[provider] ??
        DEFAULT_MODEL_BY_PROVIDER.anthropic,
      systemPrompt: createAgentDto.systemPrompt ?? null,
      effort: createAgentDto.effort ?? null,
      toolsEnabled: createAgentDto.toolsEnabled ?? null,
    });
  }

  findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }) {
    return this.agentRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  findById(id: Agent['id']) {
    return this.agentRepository.findById(id);
  }

  findEnabledByBrand(brandId: number) {
    return this.agentRepository.findEnabledByBrand(brandId);
  }

  update(id: Agent['id'], updateAgentDto: UpdateAgentDto) {
    return this.agentRepository.update(id, { ...updateAgentDto });
  }

  remove(id: Agent['id']) {
    return this.agentRepository.remove(id);
  }

  /**
   * Test console: run the agent against a single user message without touching
   * any real channel. Backs POST /agents/:id/test.
   */
  async test(id: Agent['id'], message: string): Promise<AgentRuntimeResult> {
    const agent = await this.agentRepository.findById(id);
    if (!agent) {
      throw new NotFoundException('Agent not found');
    }
    return this.runtimes.resolve(agent.provider).run({
      agent,
      messages: [{ role: 'user', content: message }],
    });
  }
}
