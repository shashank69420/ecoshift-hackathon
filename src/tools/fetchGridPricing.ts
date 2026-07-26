import { ToolDecorator as Tool, z } from '@nitrostack/core';
import { getGridPricing } from '../data/gridPricing';

/**
 * Read-only tool that exposes today's hourly electricity pricing to the
 * AI agent. Data is sourced from Person A's mock generator
 * (src/data/gridPricing.ts) — an array of GridPricePoint { hour, price }.
 */
export class GridPricingTools {
  @Tool({
    name: 'fetch_grid_pricing',
    description: 'Fetch the hourly electricity grid pricing for the day (hour 0-23 with $/kWh price).',
    inputSchema: z.object({})
  })
  async fetchGridPricing() {
    return getGridPricing();
  }
}