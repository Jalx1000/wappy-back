import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  AgentRunContext,
  AgentRuntime,
  AgentRuntimeMessage,
  AgentRuntimeResult,
  AgentTool,
} from './agent-runtime';
import { Agent } from '../domain/agent';

const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_SYSTEM = 'You are a helpful customer-support assistant.';
const MAX_TOKENS = 1024;
const MAX_TOOL_ITERATIONS = 5;

/**
 * ChatGPT / OpenAI runtime, using the official `openai` SDK. Selected per-agent
 * when Agent.provider === 'openai'. The client is created lazily so the app
 * boots without OPENAI_API_KEY (the key is only required when an openai agent
 * actually runs).
 */
@Injectable()
export class OpenAiAgentRuntime extends AgentRuntime {
  private readonly logger = new Logger(OpenAiAgentRuntime.name);
  private client?: OpenAI;

  constructor(private readonly config: ConfigService) {
    super();
  }

  private getClient(): OpenAI {
    if (!this.client) {
      const apiKey = this.config.get<string>('OPENAI_API_KEY');
      if (!apiKey || apiKey === 'placeholder-not-set') {
        throw new ServiceUnavailableException(
          'OPENAI_API_KEY is not configured',
        );
      }
      this.client = new OpenAI({ apiKey });
    }
    return this.client;
  }

  async run(input: {
    agent: Agent;
    messages: AgentRuntimeMessage[];
    context: AgentRunContext;
    tools?: AgentTool[];
  }): Promise<AgentRuntimeResult> {
    const { agent, messages, context, tools = [] } = input;
    const client = this.getClient();
    const system = agent.systemPrompt?.trim() || DEFAULT_SYSTEM;
    const model = agent.model || DEFAULT_MODEL;
    const byName = new Map(tools.map((t) => [t.name, t]));

    // Running conversation sent to the model; grows with tool calls/results.
    const convo: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: system },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const toolDefs =
      tools.length > 0
        ? tools.map((t) => ({
            type: 'function' as const,
            function: {
              name: t.name,
              description: t.description,
              parameters: t.parameters,
            },
          }))
        : undefined;

    let inputTokens = 0;
    let outputTokens = 0;

    // Tool-loop: re-query the model after each batch of tool results, up to a
    // hard cap. With no tools (or no tool_calls) it resolves on the first pass
    // exactly like the previous single-turn behavior.
    for (let i = 0; i <= MAX_TOOL_ITERATIONS; i++) {
      const completion = await client.chat.completions.create({
        model,
        max_tokens: MAX_TOKENS,
        messages: convo,
        ...(toolDefs ? { tools: toolDefs } : {}),
      });
      inputTokens += completion.usage?.prompt_tokens ?? 0;
      outputTokens += completion.usage?.completion_tokens ?? 0;

      const choice = completion.choices[0]?.message;
      const toolCalls = choice?.tool_calls ?? [];

      if (toolCalls.length === 0 || i === MAX_TOOL_ITERATIONS) {
        return {
          text: choice?.content ?? '',
          usage: { inputTokens, outputTokens },
        };
      }

      // Echo the assistant tool-call turn, then append each tool result.
      convo.push(choice as OpenAI.Chat.ChatCompletionMessageParam);
      for (const call of toolCalls) {
        if (call.type !== 'function') continue;
        const tool = byName.get(call.function.name);
        let result: unknown;
        if (!tool) {
          result = { error: `unknown tool ${call.function.name}` };
        } else {
          try {
            const args = this.parseArgs(call.function.arguments);
            result = await tool.run(args, context);
          } catch (e) {
            result = { error: `tool ${tool.name} failed` };
            this.logger.warn(`tool ${tool.name} failed: ${String(e)}`);
          }
        }
        convo.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
    }

    // Unreachable (loop returns at MAX_TOOL_ITERATIONS), but satisfies types.
    return { text: '', usage: { inputTokens, outputTokens } };
  }

  private parseArgs(raw: string | undefined): Record<string, unknown> {
    if (!raw) return {};
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
}
