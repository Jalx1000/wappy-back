import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import {
  AgentRuntime,
  AgentRuntimeMessage,
  AgentRuntimeResult,
} from './agent-runtime';
import { Agent } from '../domain/agent';

const DEFAULT_MODEL = 'claude-sonnet-4-6';
const DEFAULT_SYSTEM = 'You are a helpful customer-support assistant.';
const MAX_TOKENS = 1024;

/**
 * Default runtime built on the official Anthropic SDK — mirrors the existing
 * pattern in workers/processors/insight.processor.ts (ANTHROPIC_API_KEY via
 * ConfigService, prompt-cached system block). No tools yet; reply_text only.
 * Tool-use loop lands in C2/C4.
 */
@Injectable()
export class AnthropicAgentRuntime extends AgentRuntime {
  private readonly logger = new Logger(AnthropicAgentRuntime.name);
  private readonly anthropic: Anthropic;

  constructor(private readonly config: ConfigService) {
    super();
    this.anthropic = new Anthropic({
      apiKey: this.config.getOrThrow<string>('ANTHROPIC_API_KEY'),
    });
  }

  async run(input: {
    agent: Agent;
    messages: AgentRuntimeMessage[];
  }): Promise<AgentRuntimeResult> {
    const { agent, messages } = input;
    const system = agent.systemPrompt?.trim() || DEFAULT_SYSTEM;

    const message = await this.anthropic.messages.create({
      model: agent.model || DEFAULT_MODEL,
      max_tokens: MAX_TOKENS,
      system: [
        {
          type: 'text',
          text: system,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const text = message.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('');

    return {
      text,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    };
  }
}
