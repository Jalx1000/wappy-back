import { AgentToolRegistry } from './agent-tool.registry';
import { GetProductsTool } from './get-products.tool';
import { GetCustomerTool } from './get-customer.tool';
import { GetOrderTool } from './get-order.tool';

const products = { name: 'get_products' } as GetProductsTool;
const customer = { name: 'get_customer' } as GetCustomerTool;
const order = { name: 'get_order' } as GetOrderTool;
const registry = new AgentToolRegistry(products, customer, order);

describe('AgentToolRegistry.forAgent', () => {
  it('should return no tools when toolsEnabled is empty or null', () => {
    expect(registry.forAgent(null)).toEqual([]);
    expect(registry.forAgent([])).toEqual([]);
  });

  it('should return only the enabled tools, in registry order', () => {
    const only = registry.forAgent(['get_customer']);
    expect(only.map((t) => t.name)).toEqual(['get_customer']);

    const all = registry.forAgent([
      'get_order',
      'get_customer',
      'get_products',
    ]);
    expect(all.map((t) => t.name)).toEqual([
      'get_products',
      'get_customer',
      'get_order',
    ]);
  });

  it('should ignore unknown tool names', () => {
    expect(registry.forAgent(['nope']).map((t) => t.name)).toEqual([]);
  });
});
