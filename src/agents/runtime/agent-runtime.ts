import { Agent } from '../domain/agent';

export interface AgentRuntimeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentRuntimeResult {
  text: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Server-owned execution context for a run. `brandId` scopes every tool so the
 * model can never query another brand's data; `conversationId`/`contactId` let
 * tools default to the current conversation's customer.
 */
export interface AgentRunContext {
  brandId: number;
  conversationId?: string;
  contactId?: string;
}

/**
 * A read-only capability the agent can invoke during a run. Provider-agnostic:
 * `parameters` is a JSON schema; `run` executes brand-scoped via [ctx] and
 * returns a JSON-serialisable result. Never trust `brandId` from [args].
 */
export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  run(args: Record<string, unknown>, ctx: AgentRunContext): Promise<unknown>;
}

/**
 * Engine that turns an Agent + a conversation into a reply. Kept behind this
 * abstract class so the LLM backend (today: @anthropic-ai/sdk, openai) is
 * swappable without touching callers. `tools` is optional — when empty the
 * runtime behaves as a single-turn chat (C1 behavior); when present, the
 * runtime may run a tool-loop (OpenAI implements it in AT4).
 */
export abstract class AgentRuntime {
  abstract run(input: {
    agent: Agent;
    messages: AgentRuntimeMessage[];
    context: AgentRunContext;
    tools?: AgentTool[];
  }): Promise<AgentRuntimeResult>;
}
