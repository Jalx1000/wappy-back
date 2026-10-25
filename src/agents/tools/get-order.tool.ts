import { Injectable } from '@nestjs/common';
import { OrdersService } from '../../orders/orders.service';
import { AgentRunContext, AgentTool } from '../runtime/agent-runtime';

/**
 * Lets the agent read the latest order of the conversation's customer: its
 * stage, total, notes and line items. A customer may have several orders;
 * this returns the most recent. Brand-scoped via `ctx.brandId`; uses
 * `ctx.contactId` to resolve the conversation's customer.
 */
@Injectable()
export class GetOrderTool implements AgentTool {
  constructor(private readonly orders: OrdersService) {}

  readonly name = 'get_order';
  readonly description =
    "Get the latest order (and its pipeline stage) of this conversation's " +
    'customer. Use to answer about order status, stage, total or items.';
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
    const order = await this.orders.getLatestForContact(
      ctx.brandId,
      ctx.contactId,
    );
    if (!order) return { found: false, reason: 'no order for this customer' };
    return {
      found: true,
      order: {
        status: order.status,
        total: order.total ?? 0,
        currency: order.currency ?? 'USD',
        notes: order.notes ?? null,
        items: order.items ?? [],
      },
    };
  }
}
