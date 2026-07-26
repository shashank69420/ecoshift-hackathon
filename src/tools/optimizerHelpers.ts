// src/tools/optimizerHelpers.ts
// Owned by Person C.
// Pure functions only. No "AI" logic lives here on purpose — this file just
// answers "what would X cost / is X allowed", so the LLM can reason about
// options using real numbers instead of guessing.

import { Job, GridPricePoint } from "../types";

/**
 * Cost of running a job that starts at `startHour` (can be fractional, e.g.
 * 14.5 = 2:30 PM) for `durationHours`, given an hourly pricing curve.
 * Handles jobs that span multiple pricing hours and prorates partial hours.
 * Wraps past hour 23 back to hour 0 (treats the day as a 24h cycle).
 */
export function calculateCost(
  startHour: number,
  durationHours: number,
  pricing: GridPricePoint[]
): number {
  if (durationHours <= 0) return 0;

  const priceByHour = new Map(pricing.map((p) => [p.hour, p.price]));
  let remaining = durationHours;
  let cursor = startHour;
  let totalCost = 0;

  while (remaining > 0) {
    const hourBucket = Math.floor(cursor) % 24;
    const minutesIntoHour = cursor - Math.floor(cursor);
    const hoursLeftInBucket = 1 - minutesIntoHour;
    const chunk = Math.min(remaining, hoursLeftInBucket);

    const price = priceByHour.get(hourBucket) ?? 0;
    totalCost += chunk * price;

    remaining -= chunk;
    cursor += chunk;
  }

  return totalCost;
}

/**
 * Full dollar cost for a specific job if run starting at `startTime`.
 */
export function calculateJobCost(
  job: Pick<Job, "powerKw" | "durationHours">,
  startTime: Date,
  pricing: GridPricePoint[]
): number {
  const startHour = startTime.getHours() + startTime.getMinutes() / 60;
  const pricePerKwhIntegral = calculateCost(startHour, job.durationHours, pricing);
  return job.powerKw * pricePerKwhIntegral;
}

/**
 * Does starting this job at `startTime` satisfy its earliestStart/deadline
 * constraints?
 */
export function isWithinConstraints(job: Job, startTime: Date): boolean {
  const earliest = new Date(job.earliestStart).getTime();
  const deadline = new Date(job.deadline).getTime();
  const start = startTime.getTime();
  const end = start + job.durationHours * 60 * 60 * 1000;

  return start >= earliest && end <= deadline;
}

/**
 * All valid start times for a job, sampled every `stepMinutes`.
 */
export function getValidStartTimes(job: Job, stepMinutes: number = 30): Date[] {
  const earliest = new Date(job.earliestStart).getTime();
  const latestPossibleStart =
    new Date(job.deadline).getTime() - job.durationHours * 60 * 60 * 1000;

  if (latestPossibleStart < earliest) return [];

  const stepMs = stepMinutes * 60 * 1000;
  const slots: Date[] = [];
  for (let t = earliest; t <= latestPossibleStart; t += stepMs) {
    slots.push(new Date(t));
  }
  return slots;
}