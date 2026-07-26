// src/tools/getProductionSchedule.ts
// Owned by Person B.
// Read-only tool that exposes today's production schedule to the AI agent.
// Data is sourced from Person A's mock generator (src/data/schedule.ts) —
// an array of Job { id, jobName, machineId, powerKw, durationHours,
// earliestStart, deadline, scheduledStart }.

import { ToolDecorator as Tool, z } from '@nitrostack/core';
import { getProductionSchedule } from '../data/schedule';

export class ScheduleTools {
  @Tool({
    name: 'get_production_schedule',
    description:
      "Fetch today's factory production schedule: every job's machine, power draw (kW), duration, earliest allowed start, deadline, and currently planned start time.",
    inputSchema: z.object({}),
  })
  async getProductionSchedule() {
    return getProductionSchedule();
  }
}