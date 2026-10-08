import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { AgentRepository } from './infrastructure/persistence/agent.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { Agent } from './domain/agent';
import { AgentRuntime, AgentRuntimeResult } from './runtime/agent-runtime';

@Injectable()
export class AgentsService {
  constructor(
    private readonly agentRepository: AgentRepository,
    private readonly agentRuntime: AgentRuntime,
  ) {}

  create(createAgentDto: CreateAgentDto) {
    return this.agentRepository.create({
      brandId: createAgentDto.brandId,
      name: createAgentDto.name,
      enabled: createAgentDto.enabled ?? false,
      model: createAgentDto.model ?? 'claude-sonnet-4-6',
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
    return this.agentRuntime.run({
      agent,
      messages: [{ role: 'user', content: message }],
    });
  }
}
