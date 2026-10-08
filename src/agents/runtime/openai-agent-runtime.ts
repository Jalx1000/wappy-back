import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  AgentRuntime,
  AgentRuntimeMessage,
  AgentRuntimeResult,
} from './agent-runtime';
import { Agent } from '../domain/agent';

const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_SYSTEM = 'You are a helpful customer-support assistant.';
const MAX_TOKENS = 1024;

/**
 * ChatGPT / OpenAI runtime, using the official `openai` SDK. Selected per-agent
 * when Agent.provider === 'openai'. Reads OPENAI_API_KEY via ConfigService,
 * mirroring how the Anthropic runtime reads ANTHROPIC_API_KEY.
 */
@Injectable()
export class OpenAiAgentRuntime extends AgentRuntime {
  private readonly logger = new Logger(OpenAiAgentRuntime.name);
  private readonly client: OpenAI;

  constructor(private readonly config: ConfigService) {
    super();
    this.client = new OpenAI({
      apiKey: this.config.getOrThrow<string>('OPENAI_API_KEY'),
    });
  }

  async run(input: {
    agent: Agent;
    messages: AgentRuntimeMessage[];
  }): Promise<AgentRuntimeResult> {
    const { agent, messages } = input;
    const system = agent.systemPrompt?.trim() || DEFAULT_SYSTEM;

    const completion = await this.client.chat.completions.create({
      model: agent.model || DEFAULT_MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        { role: 'system', content: system },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    });

    const text = completion.choices[0]?.message?.content ?? '';

    return {
      text,
      usage: {
        inputTokens: completion.usage?.prompt_tokens ?? 0,
        outputTokens: completion.usage?.completion_tokens ?? 0,
      },
    };
  }
}
