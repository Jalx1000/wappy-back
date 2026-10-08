import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { AgentRepository } from './infrastructure/persistence/agent.repository';
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

  create(brandId: number, dto: CreateAgentDto) {
    const provider = dto.provider ?? 'anthropic';
    return this.agentRepository.create({
      brandId,
      name: dto.name,
      enabled: dto.enabled ?? false,
      provider,
      model:
        dto.model ??
        DEFAULT_MODEL_BY_PROVIDER[provider] ??
        DEFAULT_MODEL_BY_PROVIDER.anthropic,
      systemPrompt: dto.systemPrompt ?? null,
      effort: dto.effort ?? null,
      toolsEnabled: dto.toolsEnabled ?? null,
    });
  }

  listForBrand(brandId: number) {
    return this.agentRepository.findByBrand(brandId);
  }

  async findOne(brandId: number, id: Agent['id']): Promise<Agent> {
    const agent = await this.agentRepository.findById(id);
    if (!agent || agent.brandId !== brandId) {
      throw new NotFoundException('Agent not found');
    }
    return agent;
  }

  async update(brandId: number, id: Agent['id'], dto: UpdateAgentDto) {
    await this.findOne(brandId, id); // enforce brand ownership
    return this.agentRepository.update(id, { ...dto });
  }

  async remove(brandId: number, id: Agent['id']): Promise<void> {
    await this.findOne(brandId, id); // enforce brand ownership
    await this.agentRepository.remove(id);
  }

  findEnabledByBrand(brandId: number) {
    return this.agentRepository.findEnabledByBrand(brandId);
  }

  /**
   * Test console: run the agent against a single user message without touching
   * any real channel. Backs POST /agents/:id/test. Brand-scoped.
   */
  async test(
    brandId: number,
    id: Agent['id'],
    message: string,
  ): Promise<AgentRuntimeResult> {
    const agent = await this.findOne(brandId, id);
    return this.runtimes.resolve(agent.provider).run({
      agent,
      messages: [{ role: 'user', content: message }],
    });
  }
}
