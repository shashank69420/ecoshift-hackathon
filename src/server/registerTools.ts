// src/server/registerTools.ts
// Owned by Person D.
// Root module — this is where every tool class gets wired into the actual
// MCP server. If a tool exists but isn't listed in `controllers` below,
// the LLM will never see it.

import { McpApp, Module, ConfigModule } from '@nitrostack/core';
import { GridPricingTools } from '../tools/fetchGridPricing';
import { ScheduleTools } from '../tools/getProductionSchedule';
import { OptimizerTools } from '../tools/optimizeSchedule';

@McpApp({
  module: EcoShiftModule,
  server: {
    name: 'ecoshift-server',
    version: '1.0.0',
  },
})
@Module({
  name: 'ecoshift',
  imports: [ConfigModule.forRoot()],
  controllers: [GridPricingTools, ScheduleTools, OptimizerTools],
})
export class EcoShiftModule {}