import { AgentToolRegistry } from './agent-tool.registry';
import { GetProductsTool } from './get-products.tool';
import { GetCustomerTool } from './get-customer.tool';

const products = { name: 'get_products' } as GetProductsTool;
const customer = { name: 'get_customer' } as GetCustomerTool;
const registry = new AgentToolRegistry(products, customer);

describe('AgentToolRegistry.forAgent', () => {
  it('should return no tools when toolsEnabled is empty or null', () => {
    expect(registry.forAgent(null)).toEqual([]);
    expect(registry.forAgent([])).toEqual([]);
  });

  it('should return only the enabled tools, in registry order', () => {
    const only = registry.forAgent(['get_customer']);
    expect(only.map((t) => t.name)).toEqual(['get_customer']);

    const both = registry.forAgent(['get_customer', 'get_products']);
    expect(both.map((t) => t.name)).toEqual(['get_products', 'get_customer']);
  });

  it('should ignore unknown tool names', () => {
    expect(registry.forAgent(['nope']).map((t) => t.name)).toEqual([]);
  });
});
