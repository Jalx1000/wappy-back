import { Injectable } from '@nestjs/common';
import { AgentTool } from '../runtime/agent-runtime';
import { GetProductsTool } from './get-products.tool';
import { GetCustomerTool } from './get-customer.tool';
import { GetOrderTool } from './get-order.tool';

/**
 * Collects the available agent tools and selects which ones a given agent may
 * use, based on its `toolsEnabled` list (tool names). An empty/undefined list
 * means the agent uses no tools (single-turn chat — C1 behavior).
 */
@Injectable()
export class AgentToolRegistry {
  private readonly all: AgentTool[];

  constructor(
    products: GetProductsTool,
    customer: GetCustomerTool,
    order: GetOrderTool,
  ) {
    this.all = [products, customer, order];
  }

  /** The tools enabled for an agent, in registry order. */
  forAgent(toolsEnabled?: string[] | null): AgentTool[] {
    if (!toolsEnabled || toolsEnabled.length === 0) return [];
    const enabled = new Set(toolsEnabled);
    return this.all.filter((t) => enabled.has(t.name));
  }
}
