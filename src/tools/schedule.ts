// src/data/schedule.ts (TEMP stub — delete once Person A pushes real one)
import { MachineJob } from "../tools/optimizerHelpers";

export const machineJobs: MachineJob[] = [
  {
    id: "job-1",
    machineName: "CNC Machine",
    durationHours: 2,
    powerDrawKw: 10,
    deadlineHour: 23,
    priority: "medium",
    latePenaltyCost: 500,
  },
];
