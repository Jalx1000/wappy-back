import { AgentRuntimeResolver } from './agent-runtime.resolver';
import { AnthropicAgentRuntime } from './anthropic-agent-runtime';
import { OpenAiAgentRuntime } from './openai-agent-runtime';

describe('AgentRuntimeResolver', () => {
  const anthropic = { run: jest.fn() } as unknown as AnthropicAgentRuntime;
  const openai = { run: jest.fn() } as unknown as OpenAiAgentRuntime;
  const resolver = new AgentRuntimeResolver(anthropic, openai);

  it('should resolve openai when provider is openai', () => {
    expect(resolver.resolve('openai')).toBe(openai);
  });

  it('should resolve anthropic for anthropic, unknown, or missing provider', () => {
    expect(resolver.resolve('anthropic')).toBe(anthropic);
    expect(resolver.resolve(undefined)).toBe(anthropic);
    expect(resolver.resolve('something-else')).toBe(anthropic);
  });
});
