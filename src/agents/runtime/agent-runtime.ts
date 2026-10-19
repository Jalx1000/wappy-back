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
 * Engine that turns an Agent + a conversation into a reply. Kept behind this
 * abstract class so the LLM backend (today: @anthropic-ai/sdk) is swappable
 * (e.g. LangChain/LangGraph in a later phase) without touching callers.
 */
export abstract class AgentRuntime {
  abstract run(input: {
    agent: Agent;
    messages: AgentRuntimeMessage[];
  }): Promise<AgentRuntimeResult>;
}
