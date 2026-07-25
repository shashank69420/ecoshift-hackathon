// Mock production schedule for "today" — heavy machinery jobs as a human
// planner would have laid them out, before EcoShift touches anything.
// Person B's tools/getProductionSchedule.ts wraps `getProductionSchedule()`
// as an MCP tool.

import { Job, Machine } from "../types";

export const MACHINES: Machine[] = [
  { id: "m-oven-1", name: "Industrial Oven #1", type: "oven" },
  { id: "m-extruder-1", name: "Heavy Extruder #1", type: "extruder" },
  { id: "m-cnc-1", name: "CNC Mill #1", type: "cnc" },
  { id: "m-compressor-1", name: "Air Compressor #1", type: "compressor" },
];

// Helper: build a Date for "today" at a given local hour (and optional minute).
function todayAt(hour: number, minute: number = 0): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

function iso(d: Date): string {
  return d.toISOString();
}

/**
 * Returns today's production plan exactly as the (mock) factory system
 * currently has it scheduled — i.e. deadline-driven, energy-price-blind.
 */
export function getProductionSchedule(): Job[] {
  return [
    {
      id: "job-001",
      jobName: "Extrude Bracket Batch 12",
      machineId: "m-extruder-1",
      powerKw: 500,
      durationHours: 3,
      earliestStart: iso(todayAt(6)),
      scheduledStart: iso(todayAt(15)),   // 3:00 PM — smack in peak pricing
      deadline: iso(todayAt(23)),         // not actually due until 11:00 PM
    },
    {
      id: "job-002",
      jobName: "Bake Cure Cycle - Panel Set A",
      machineId: "m-oven-1",
      powerKw: 350,
      durationHours: 2,
      earliestStart: iso(todayAt(8)),
      scheduledStart: iso(todayAt(14)),   // 2:00 PM — peak start
      deadline: iso(todayAt(20)),
    },
    {
      id: "job-003",
      jobName: "CNC Mill Run - Housing Units",
      machineId: "m-cnc-1",
      powerKw: 40,
      durationHours: 4,
      earliestStart: iso(todayAt(7)),
      scheduledStart: iso(todayAt(9)),    // already off-peak, low power anyway
      deadline: iso(todayAt(18)),
    },
    {
      id: "job-004",
      jobName: "Compressor Cycle - Line 3 Support",
      machineId: "m-compressor-1",
      powerKw: 120,
      durationHours: 5,
      earliestStart: iso(todayAt(10)),
      scheduledStart: iso(todayAt(13)),   // runs right into the peak window
      deadline: iso(todayAt(22)),
    },
  ];
}