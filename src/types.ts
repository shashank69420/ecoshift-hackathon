// src/types.ts
// Owned by Person A. Everyone else imports from here — treat changes as breaking
// changes and flag in the group chat before editing shapes after handoff.

/**
 * A single machine on the factory floor.
 */
export interface Machine {
  id: string;
  name: string;
  type: "oven" | "extruder" | "cnc" | "compressor" | "other";
}

/**
 * One job on today's production plan, as it comes out of the (mock) factory
 * scheduling system, BEFORE any optimization.
 */
export interface Job {
  id: string;
  jobName: string;
  machineId: string;
  powerKw: number;          // average power draw while running
  durationHours: number;    // how long the job runs, in hours
  earliestStart: string;    // ISO 8601 datetime — job cannot start before this
  deadline: string;         // ISO 8601 datetime — job MUST be finished by this
  scheduledStart: string;   // ISO 8601 datetime — where the human planner put it
}

/**
 * One hour's electricity price. `hour` is 0-23 in the local plant timezone.
 * `price` is $/kWh.
 */
export interface GridPricePoint {
  hour: number;
  price: number;
}

/**
 * A job after the optimizer has decided whether/where to move it.
 */
export interface OptimizedJob {
  id: string;
  jobName: string;
  machineId: string;
  powerKw: number;
  durationHours: number;
  deadline: string;

  originalStart: string;
  newStart: string;
  moved: boolean;

  costOriginal: number;   // $ cost of running at the original time
  costOptimized: number;  // $ cost of running at the new time
  savings: number;        // costOriginal - costOptimized
}

/**
 * Output of the full optimization pass — what optimizeSchedule.ts returns
 * and what the "ROI Calculation" step / demo script displays.
 */
export interface OptimizationResult {
  originalTotalCost: number;
  optimizedTotalCost: number;
  totalSavings: number;
  jobs: OptimizedJob[];
}