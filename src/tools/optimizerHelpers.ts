// src/tools/optimizerHelpers.ts
import { Job, GridPricePoint } from "../types";

/**
 * Extracts the local hour-of-day (0-23) from an ISO datetime string.
 */
function getHourFromIso(iso: string): number {
  return new Date(iso).getHours();
}

/**
 * Calculates the total electricity cost of running a job if it starts
 * at a given hour-of-day.
 */
export function calculateJobCost(
  job: Job,
  startHour: number,
  prices: GridPricePoint[]
): number {
  let totalCost = 0;

  for (let i = 0; i < job.durationHours; i++) {
    const hour = (startHour + i) % 24;
    const priceEntry = prices.find((p) => p.hour === hour);

    if (!priceEntry) {
      throw new Error(`No price data found for hour ${hour}`);
    }

    totalCost += priceEntry.price * job.powerKw;
  }

  return totalCost;
}

/**
 * Checks whether starting the job at `startHour` still meets both:
 *  - earliestStart (can't run before this hour)
 *  - deadline (must finish by this hour)
 */
export function isDeadlineMet(job: Job, startHour: number): boolean {
  const earliestHour = getHourFromIso(job.earliestStart);
  const deadlineHour = getHourFromIso(job.deadline);
  const finishHour = startHour + job.durationHours;

  return startHour >= earliestHour && finishHour <= deadlineHour;
}

/**
 * Scans every possible start hour (0-23), keeps only the ones that
 * respect earliestStart + deadline, and returns the cheapest valid one.
 * Returns -1 if no valid window exists at all.
 */
export function findCheapestValidWindow(
  job: Job,
  prices: GridPricePoint[]
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

export { getHourFromIso };
