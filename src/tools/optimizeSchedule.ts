// src/tools/optimizeSchedule.ts

import {
  calculateJobCost,
  findCheapestValidWindow,
  isDeadlineMet,
  MachineJob,
  HourlyPrice,
} from "./optimizerHelpers";

// TEMP: replace with real imports once Person A pushes:
// import { gridPricing } from "../data/gridPricing";
// import { machineJobs } from "../data/schedule";
import { gridPricing } from "../data/gridPricing";
import { machineJobs } from "../data/schedule";

export const optimizeScheduleTool = {
  name: "optimize_schedule",
  description:
    "Given a specific factory job (by ID) and an optional delay in hours, " +
    "calculates the electricity cost if the job runs at its originally " +
    "scheduled time vs. delayed by the given number of hours, and reports " +
    "the savings. Also reports the single cheapest possible start time " +
    "for that job across the full day, respecting its deadline.",
  inputSchema: {
    type: "object",
    properties: {
      jobId: {
        type: "string",
        description: "The ID of the job to analyze, e.g. 'job-1'",
      },
      delayHours: {
        type: "number",
        description: "How many hours to delay the job by, for comparison. Defaults to 2.",
      },
    },
    required: ["jobId"],
  },
  handler: async (input: { jobId: string; delayHours?: number }) => {
    const delay = input.delayHours ?? 2;

    const job = machineJobs.find((j: MachineJob) => j.id === input.jobId);
    if (!job) {
      return {
        error: `No job found with id "${input.jobId}". Available IDs: ${machineJobs
          .map((j: MachineJob) => j.id)
          .join(", ")}`,
      };
    }

    // Assume the job's "original" start is right now for demo purposes —
    // in a fuller version this would come from the schedule data itself.
    const originalStartHour = 0; // placeholder until Person A's schedule includes a start hour
    const delayedStartHour = originalStartHour + delay;

    const originalCost = calculateJobCost(job, originalStartHour, gridPricing);
    const delayMeetsDeadline = isDeadlineMet(job, delayedStartHour);

    const delayedCost = delayMeetsDeadline
      ? calculateJobCost(job, delayedStartHour, gridPricing)
      : null;

    const cheapestHour = findCheapestValidWindow(job, gridPricing);
    const cheapestCost =
      cheapestHour === -1 ? null : calculateJobCost(job, cheapestHour, gridPricing);

    return {
      jobId: job.id,
      machineName: job.machineName,
      originalStartHour,
      originalCost,
      delayHours: delay,
      delayedStartHour,
      delayMeetsDeadline,
      delayedCost,
      savingsFromDelay: delayedCost !== null ? originalCost - delayedCost : null,
      cheapestPossibleStartHour: cheapestHour === -1 ? "No valid window found" : cheapestHour,
      cheapestPossibleCost: cheapestCost,
      maxPossibleSavings: cheapestCost !== null ? originalCost - cheapestCost : null,
    };
  },
};
