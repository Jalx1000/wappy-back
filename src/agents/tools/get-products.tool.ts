import { Injectable } from '@nestjs/common';
import { ProductsService } from '../../products/products.service';
import { AgentRunContext, AgentTool } from '../runtime/agent-runtime';

const DEFAULT_LIMIT = 20;
const FETCH_LIMIT = 100;

/**
 * Lets the agent search the brand's PUBLISHED catalog (`isActive: true`).
 * Brand-scoped via `ctx.brandId` — never from model args. Payload is trimmed to
 * the fields a support agent needs, capped to keep the model context small.
 */
@Injectable()
export class GetProductsTool implements AgentTool {
  constructor(private readonly products: ProductsService) {}

  readonly name = 'get_products';
  readonly description =
    "Search the brand's published product catalog. Use to answer questions " +
    'about availability, price, stock or product details.';
  readonly parameters = {
    type: 'object',
    properties: {
      search: {
        type: 'string',
        description: 'Optional text to match against name, SKU or category.',
      },
      limit: {
        type: 'number',
        description: `Max products to return (default ${DEFAULT_LIMIT}).`,
      },
    },
  };

  async run(
    args: Record<string, unknown>,
    ctx: AgentRunContext,
  ): Promise<unknown> {
    const search =
      typeof args.search === 'string' ? args.search.toLowerCase().trim() : '';
    const limit =
      typeof args.limit === 'number' && args.limit > 0
        ? Math.min(args.limit, FETCH_LIMIT)
        : DEFAULT_LIMIT;

    const all = await this.products.findAllWithPagination({
      paginationOptions: { page: 1, limit: FETCH_LIMIT },
      brandId: ctx.brandId,
    });

    const matched = all
      .filter((p) => p.isActive)
      .filter((p) => {
        if (!search) return true;
        const hay =
          `${p.name} ${p.sku} ${p.category} ${p.description ?? ''}`.toLowerCase();
        return hay.includes(search);
      })
      .slice(0, limit)
      .map((p) => ({
        sku: p.sku,
        name: p.name,
        description: p.description ?? null,
        price: p.price,
        stock: p.stock,
        category: p.category,
      }));

    return { count: matched.length, products: matched };
  }
}
