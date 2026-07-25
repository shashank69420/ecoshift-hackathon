// src/tools/optimizeSchedule.ts
import { getProductionSchedule } from "../data/schedule";
import { getGridPricing } from "../data/gridPricing";
import { Job, OptimizedJob, OptimizationResult } from "../types";
import {
  calculateJobCost,
  findCheapestValidWindow,
  getHourFromIso,
} from "./optimizerHelpers";

function isoAtHour(referenceIso: string, hour: number): string {
  const d = new Date(referenceIso);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export const optimizeScheduleTool = {
  name: "optimize_schedule",
  description:
    "Analyzes today's factory production schedule against current electricity " +
    "pricing and finds the cheapest valid start time for each job (or a specific " +
    "job by ID), without violating its deadline. Returns cost savings per job " +
    "and in total. Use this when the user asks about reducing energy costs, " +
    "rescheduling jobs, or wants to know potential savings.",
  inputSchema: {
    type: "object",
    properties: {
      jobId: {
        type: "string",
        description:
          "Optional. If provided, only this job is analyzed. Otherwise all jobs are optimized.",
      },
    },
    required: [],
  },
  handler: async (input: { jobId?: string }): Promise<OptimizationResult> => {
    const allJobs = getProductionSchedule();
    const prices = getGridPricing();

    const jobsToOptimize = input.jobId
      ? allJobs.filter((j) => j.id === input.jobId)
      : allJobs;

    const optimizedJobs: OptimizedJob[] = jobsToOptimize.map((job: Job) => {
      const originalStartHour = getHourFromIso(job.scheduledStart);
      const costOriginal = calculateJobCost(job, originalStartHour, prices);

      const cheapestHour = findCheapestValidWindow(job, prices);
      const foundBetterSlot = cheapestHour !== -1;

      const costOptimized = foundBetterSlot
        ? calculateJobCost(job, cheapestHour, prices)
        : costOriginal;

      const newStart = foundBetterSlot
        ? isoAtHour(job.scheduledStart, cheapestHour)
        : job.scheduledStart;

      return {
        id: job.id,
        jobName: job.jobName,
        machineId: job.machineId,
        powerKw: job.powerKw,
        durationHours: job.durationHours,
        deadline: job.deadline,
        originalStart: job.scheduledStart,
        newStart,
        moved: foundBetterSlot && cheapestHour !== originalStartHour,
        costOriginal,
        costOptimized,
        savings: costOriginal - costOptimized,
      };
    });

    const originalTotalCost = optimizedJobs.reduce((sum, j) => sum + j.costOriginal, 0);
    const optimizedTotalCost = optimizedJobs.reduce((sum, j) => sum + j.costOptimized, 0);

    return {
      originalTotalCost,
      optimizedTotalCost,
      totalSavings: originalTotalCost - optimizedTotalCost,
      jobs: optimizedJobs,
    };
  },
};
