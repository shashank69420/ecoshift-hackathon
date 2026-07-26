// src/tools/optimizeSchedule.ts
// Owned by Person C.
// These are the functions Person D will wrap as MCP tools. Each one answers
// a specific question the LLM might ask — it does NOT decide on its own
// which job to move or why. The LLM calls these to check its own reasoning
// against real numbers, then proposes the move to the Plant Manager itself.

import { ToolDecorator as Tool, z } from '@nitrostack/core';
import { Job, GridPricePoint, OptimizedJob, OptimizationResult } from "../types";
import { getProductionSchedule } from "../data/schedule";
import { getGridPricing } from "../data/gridPricing";
import {
  calculateJobCost,
  isWithinConstraints,
  getValidStartTimes,
} from "./optimizerHelpers";

/**
 * Tool name suggestion: `evaluate_job_at_time`
 * Input: jobId, proposedStartTime
 * Output: cost at the proposed time, whether it's legal, and the $ delta
 * vs the job's currently scheduled time.
 *
 * Use case: LLM has a hunch ("what if I ran this at 7 PM instead?") and
 * wants the real cost + a constraint check before proposing it.
 */
export function evaluateJobAtTime(
  job: Job,
  proposedStartTime: Date,
  pricing: GridPricePoint[]
): {
  isValid: boolean;
  originalCost: number;
  proposedCost: number;
  savings: number;
} {
  const originalCost = calculateJobCost(job, new Date(job.scheduledStart), pricing);
  const proposedCost = calculateJobCost(job, proposedStartTime, pricing);
  const isValid = isWithinConstraints(job, proposedStartTime);

  return {
    isValid,
    originalCost,
    proposedCost,
    savings: originalCost - proposedCost,
  };
}

/**
 * Tool name suggestion: `find_cheapest_slot`
 * Input: jobId
 * Output: the single cheapest legal start time for this job, and how much
 * cheaper it is than the job's current scheduled time.
 *
 * Use case: LLM has already identified a job as "worth investigating" (e.g.
 * it's in the 2-6PM window) and wants the best available alternative.
 */
export function findCheapestSlot(
  job: Job,
  pricing: GridPricePoint[],
  stepMinutes: number = 30
): OptimizedJob {
  const originalCost = calculateJobCost(job, new Date(job.scheduledStart), pricing);
  const candidates = getValidStartTimes(job, stepMinutes);

  // No legal alternative slots (e.g. deadline is too tight) — job stays put.
  if (candidates.length === 0) {
    return {
      id: job.id,
      jobName: job.jobName,
      machineId: job.machineId,
      powerKw: job.powerKw,
      durationHours: job.durationHours,
      deadline: job.deadline,
      originalStart: job.scheduledStart,
      newStart: job.scheduledStart,
      moved: false,
      costOriginal: originalCost,
      costOptimized: originalCost,
      savings: 0,
    };
  }

  let bestStart = new Date(job.scheduledStart);
  let bestCost = originalCost;

  for (const candidate of candidates) {
    const cost = calculateJobCost(job, candidate, pricing);
    if (cost < bestCost) {
      bestCost = cost;
      bestStart = candidate;
    }
  }

  const moved = bestStart.getTime() !== new Date(job.scheduledStart).getTime();

  return {
    id: job.id,
    jobName: job.jobName,
    machineId: job.machineId,
    powerKw: job.powerKw,
    durationHours: job.durationHours,
    deadline: job.deadline,
    originalStart: job.scheduledStart,
    newStart: bestStart.toISOString(),
    moved,
    costOriginal: originalCost,
    costOptimized: bestCost,
    savings: originalCost - bestCost,
  };
}

/**
 * Tool name suggestion: `optimize_full_schedule`
 * Input: none (reads today's schedule + pricing itself)
 * Output: every job's optimization result + total $ saved across the shift.
 *
 * Use case: the "run the whole optimization" button — this is what powers
 * the final ROI number shown to the Plant Manager.
 */
export function optimizeFullSchedule(
  jobs: Job[],
  pricing: GridPricePoint[],
  stepMinutes: number = 30
): OptimizationResult {
  const optimizedJobs = jobs.map((job) => findCheapestSlot(job, pricing, stepMinutes));

  const originalTotalCost = optimizedJobs.reduce((sum, j) => sum + j.costOriginal, 0);
  const optimizedTotalCost = optimizedJobs.reduce((sum, j) => sum + j.costOptimized, 0);

  return {
    originalTotalCost,
    optimizedTotalCost,
    totalSavings: originalTotalCost - optimizedTotalCost,
    jobs: optimizedJobs,
  };
}

// ── MCP tool wrappers ──────────────────────────────────────────
// These are what Person D registers. They read live data themselves
// (via getProductionSchedule / getGridPricing) so the LLM never has to
// pass the full schedule/pricing arrays through as tool input.

export class OptimizerTools {
  @Tool({
    name: 'evaluate_job_at_time',
    description:
      'Given a jobId and a proposed ISO 8601 start time, returns whether that time is legal (respects the deadline), the cost at the original scheduled time, the cost at the proposed time, and the dollar savings.',
    inputSchema: z.object({
      jobId: z.string().describe("The job's id, e.g. 'job-001'"),
      proposedStartTime: z
        .string()
        .describe('ISO 8601 datetime to evaluate, e.g. "2026-07-26T19:00:00.000Z"'),
    }),
  })
  async evaluateJobAtTimeTool(input: { jobId: string; proposedStartTime: string }) {
    const jobs = getProductionSchedule();
    const pricing = getGridPricing();
    const job = jobs.find((j) => j.id === input.jobId);

    if (!job) {
      return {
        error: `No job found with id "${input.jobId}". Available IDs: ${jobs
          .map((j) => j.id)
          .join(', ')}`,
      };
    }

    return evaluateJobAtTime(job, new Date(input.proposedStartTime), pricing);
  }

  @Tool({
    name: 'find_cheapest_slot',
    description:
      "Given a jobId, searches every legal start time between the job's earliestStart and its deadline, and returns the single cheapest valid slot plus the savings vs. its currently scheduled time.",
    inputSchema: z.object({
      jobId: z.string().describe("The job's id, e.g. 'job-001'"),
    }),
  })
  async findCheapestSlotTool(input: { jobId: string }) {
    const jobs = getProductionSchedule();
    const pricing = getGridPricing();
    const job = jobs.find((j) => j.id === input.jobId);

    if (!job) {
      return {
        error: `No job found with id "${input.jobId}". Available IDs: ${jobs
          .map((j) => j.id)
          .join(', ')}`,
      };
    }

    return findCheapestSlot(job, pricing);
  }

  @Tool({
    name: 'optimize_full_schedule',
    description:
      "Runs the optimizer across every job in today's schedule and returns each job's best legal start time plus the total dollar savings for the full shift. This is the tool that produces the final ROI number for the Plant Manager.",
    inputSchema: z.object({}),
  })
  async optimizeFullScheduleTool() {
    const jobs = getProductionSchedule();
    const pricing = getGridPricing();
    return optimizeFullSchedule(jobs, pricing);
  }
}