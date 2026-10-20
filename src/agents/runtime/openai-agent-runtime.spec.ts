import { ConfigService } from '@nestjs/config';
import { OpenAiAgentRuntime } from './openai-agent-runtime';
import { AgentTool } from './agent-runtime';
import { Agent } from '../domain/agent';

const agent = { provider: 'openai', model: 'gpt-4o-mini' } as Agent;

/** Installs a fake OpenAI client whose create() returns queued responses. */
function withFakeClient(runtime: OpenAiAgentRuntime, responses: unknown[]) {
  const create = jest.fn();
  for (const r of responses) create.mockResolvedValueOnce(r);
  (runtime as unknown as { client: unknown }).client = {
    chat: { completions: { create } },
  };
  return create;
}

const makeRuntime = () =>
  new OpenAiAgentRuntime({ get: () => 'sk-test' } as unknown as ConfigService);

describe('OpenAiAgentRuntime tool-loop', () => {
  it('should execute a tool call then return the final text', async () => {
    const runtime = makeRuntime();
    const toolRun = jest.fn().mockResolvedValue({ count: 1, products: [] });
    const tool: AgentTool = {
      name: 'get_products',
      description: 'd',
      parameters: {},
      run: toolRun,
    };

    const create = withFakeClient(runtime, [
      {
        choices: [
          {
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [
                {
                  id: 'call_1',
                  type: 'function',
                  function: {
                    name: 'get_products',
                    arguments: '{"search":"azul"}',
                  },
                },
              ],
            },
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5 },
      },
      {
        choices: [
          { message: { role: 'assistant', content: 'Tenemos el azul.' } },
        ],
        usage: { prompt_tokens: 8, completion_tokens: 4 },
      },
    ]);

    const res = await runtime.run({
      agent,
      messages: [{ role: 'user', content: '¿tienen azul?' }],
      context: { brandId: 7, contactId: 'c1' },
      tools: [tool],
    });

    // Tool executed with parsed args + server context (brandId never from model).
    expect(toolRun).toHaveBeenCalledWith(
      { search: 'azul' },
      { brandId: 7, contactId: 'c1' },
    );
    expect(res.text).toBe('Tenemos el azul.');
    // Two model calls (tool turn + final), usage accumulated.
    expect(create).toHaveBeenCalledTimes(2);
    expect(res.usage).toEqual({ inputTokens: 18, outputTokens: 9 });
  });

  it('should behave as single-turn chat when no tools', async () => {
    const runtime = makeRuntime();
    const create = withFakeClient(runtime, [
      {
        choices: [{ message: { role: 'assistant', content: 'Hola' } }],
        usage: { prompt_tokens: 3, completion_tokens: 2 },
      },
    ]);

    const res = await runtime.run({
      agent,
      messages: [{ role: 'user', content: 'hola' }],
      context: { brandId: 7 },
    });

    expect(res.text).toBe('Hola');
    expect(create).toHaveBeenCalledTimes(1);
    // No tools passed → no `tools` field in the request.
    expect(create.mock.calls[0][0]).not.toHaveProperty('tools');
  });
});
