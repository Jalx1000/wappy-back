import { Injectable } from '@nestjs/common';
import { OrdersService } from '../../orders/orders.service';
import { AgentRunContext, AgentTool } from '../runtime/agent-runtime';

/**
 * Lets the agent read the order (kanban card) of the conversation's customer:
 * its stage, total and notes. Brand-scoped via `ctx.brandId`; uses
 * `ctx.contactId` to resolve the current conversation's order.
 */
@Injectable()
export class GetOrderTool implements AgentTool {
  constructor(private readonly orders: OrdersService) {}

  readonly name = 'get_order';
  readonly description =
    "Get the order (and its pipeline stage) of this conversation's customer. " +
    'Use to answer about order status, stage or total.';
  readonly parameters = {
    type: 'object',
    properties: {},
  };

  async run(
    _args: Record<string, unknown>,
    ctx: AgentRunContext,
  ): Promise<unknown> {
    if (!ctx.contactId) {
      return { found: false, reason: 'no contact in this conversation' };
    }
    const order = await this.orders.getForContact(ctx.brandId, ctx.contactId);
    if (!order) return { found: false, reason: 'no order for this customer' };
    return {
      found: true,
      order: {
        status: order.status,
        total: order.total ?? 0,
        currency: order.currency ?? 'USD',
        notes: order.notes ?? null,
      },
    };
  }
}
