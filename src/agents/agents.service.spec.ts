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

  const sampleAgent: Agent = {
    id: 'agent-1',
    brandId: 7,
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

  it('should apply defaults on create (enabled=false, model=sonnet)', async () => {
    repo.create.mockResolvedValue(sampleAgent);

    await service.create({ brandId: 7, name: 'Soporte' });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        brandId: 7,
        name: 'Soporte',
        enabled: false,
        provider: 'anthropic',
        model: 'claude-sonnet-4-6',
        systemPrompt: null,
        effort: null,
        toolsEnabled: null,
      }),
    );
  });

  it('should throw NotFound from test() when the agent does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(service.test('missing', 'hola')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(runtime.run).not.toHaveBeenCalled();
  });

  it('should run the runtime with the user message on test()', async () => {
    repo.findById.mockResolvedValue(sampleAgent);
    runtime.run.mockResolvedValue({
      text: 'Hola, ¿en qué te ayudo?',
      usage: { inputTokens: 10, outputTokens: 8 },
    });

    const result = await service.test('agent-1', 'hola');

    expect(resolver.resolve).toHaveBeenCalledWith('anthropic');
    expect(runtime.run).toHaveBeenCalledWith({
      agent: sampleAgent,
      messages: [{ role: 'user', content: 'hola' }],
    });
    expect(result.text).toContain('Hola');
  });
});
