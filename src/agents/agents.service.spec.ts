import { NotFoundException } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { AgentRepository } from './infrastructure/persistence/agent.repository';
import { AgentRuntime } from './runtime/agent-runtime';
import { AgentRuntimeResolver } from './runtime/agent-runtime.resolver';
import { Agent } from './domain/agent';

describe('AgentsService', () => {
  let service: AgentsService;
  let repo: jest.Mocked<AgentRepository>;
  let runtime: jest.Mocked<AgentRuntime>;
  let resolver: jest.Mocked<AgentRuntimeResolver>;

  const BRAND = 7;
  const sampleAgent: Agent = {
    id: 'agent-1',
    brandId: BRAND,
    name: 'Soporte',
    enabled: true,
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
    systemPrompt: 'Eres un asistente de soporte.',
    effort: null,
    toolsEnabled: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      findAllWithPagination: jest.fn(),
      findById: jest.fn(),
      findByBrand: jest.fn(),
      findEnabledByBrand: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<AgentRepository>;

    runtime = {
      run: jest.fn(),
    } as unknown as jest.Mocked<AgentRuntime>;

    resolver = {
      resolve: jest.fn().mockReturnValue(runtime),
    } as unknown as jest.Mocked<AgentRuntimeResolver>;

    service = new AgentsService(repo, resolver);
  });

  it('should create with the current brand id and apply defaults', async () => {
    repo.create.mockResolvedValue(sampleAgent);

    await service.create(BRAND, { name: 'Soporte' });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        brandId: BRAND,
        name: 'Soporte',
        enabled: false,
        provider: 'anthropic',
        model: 'claude-sonnet-4-6',
      }),
    );
  });

  it('should default the model to gpt-4o-mini when provider is openai', async () => {
    repo.create.mockResolvedValue(sampleAgent);

    await service.create(BRAND, { name: 'Ventas', provider: 'openai' });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'openai', model: 'gpt-4o-mini' }),
    );
  });

  it('should throw NotFound when the agent belongs to another brand', async () => {
    repo.findById.mockResolvedValue({ ...sampleAgent, brandId: 999 });

    await expect(service.test(BRAND, 'agent-1', 'hola')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(runtime.run).not.toHaveBeenCalled();
  });

  it('should run the resolved runtime on test() for an owned agent', async () => {
    repo.findById.mockResolvedValue(sampleAgent);
    runtime.run.mockResolvedValue({
      text: 'Hola, ¿en qué te ayudo?',
      usage: { inputTokens: 10, outputTokens: 8 },
    });

    const result = await service.test(BRAND, 'agent-1', 'hola');

    expect(resolver.resolve).toHaveBeenCalledWith('anthropic');
    expect(runtime.run).toHaveBeenCalledWith({
      agent: sampleAgent,
      messages: [{ role: 'user', content: 'hola' }],
    });
    expect(result.text).toContain('Hola');
  });
});
