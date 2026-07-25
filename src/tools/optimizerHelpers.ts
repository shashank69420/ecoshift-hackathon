// ── Temporary local types ──────────────────────────────────────
// These match what Person A's types.ts will export.
// Once A pushes the real file, delete this block and replace with:
// import type { HourlyPrice, MachineJob } from "../types";

export interface HourlyPrice {
  hour: number;        // 0–23
  pricePerKwh: number;
}

export interface MachineJob {
  id: string;
  machineName: string;
  durationHours: number;
  powerDrawKw: number;
  deadlineHour: number;      // must finish by this hour
  priority: "low" | "medium" | "high";
  latePenaltyCost: number;
}
// ────────────────────────────────────────────────────────────────

/**
 * Calculates the total electricity cost of running a job
 * if it starts at a given hour.
 *
 * Logic: a job that takes `durationHours` starting at `startHour`
 * "occupies" that many consecutive hours. We look up the price
 * for each of those hours and sum (price × power draw).
 */
export function calculateJobCost(
  job: MachineJob,
  startHour: number,
  prices: HourlyPrice[]
): number {
  let totalCost = 0;

  for (let i = 0; i < job.durationHours; i++) {
    const hour = (startHour + i) % 24; // wraps past midnight
    const priceEntry = prices.find((p) => p.hour === hour);

    if (!priceEntry) {
      throw new Error(`No price data found for hour ${hour}`);
    }

    totalCost += priceEntry.pricePerKwh * job.powerDrawKw;
  }

  return totalCost;
}

/**
 * Checks whether starting the job at `startHour` lets it
 * finish before its deadline.
 */
export function isDeadlineMet(job: MachineJob, startHour: number): boolean {
  const finishHour = startHour + job.durationHours;
  return finishHour <= job.deadlineHour;
}

/**
 * Scans every possible start hour (0–23), keeps only the ones
 * that meet the deadline, and returns the cheapest valid one.
 *
 * Returns -1 if no valid window exists at all (job literally
 * cannot meet its deadline no matter when it starts).
 */
export function findCheapestValidWindow(
  job: MachineJob,
  prices: HourlyPrice[]
): number {
  let bestHour = -1;
  let bestCost = Infinity;

  for (let startHour = 0; startHour < 24; startHour++) {
    if (!isDeadlineMet(job, startHour)) continue;

    const cost = calculateJobCost(job, startHour, prices);

    if (cost < bestCost) {
      bestCost = cost;
      bestHour = startHour;
    }
  }

  return bestHour;
}
