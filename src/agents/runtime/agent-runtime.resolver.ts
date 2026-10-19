import { Injectable } from '@nestjs/common';
import { AgentRuntime } from './agent-runtime';
import { AnthropicAgentRuntime } from './anthropic-agent-runtime';
import { OpenAiAgentRuntime } from './openai-agent-runtime';

/**
 * Picks the runtime implementation for an agent based on its provider.
 * Defaults to Anthropic (Claude) when unset/unknown.
 */
@Injectable()
export class AgentRuntimeResolver {
  constructor(
    private readonly anthropic: AnthropicAgentRuntime,
    private readonly openai: OpenAiAgentRuntime,
  ) {}

  resolve(provider?: string | null): AgentRuntime {
    switch ((provider || 'anthropic').toLowerCase()) {
      case 'openai':
        return this.openai;
      case 'anthropic':
      default:
        return this.anthropic;
    }
  }
}
