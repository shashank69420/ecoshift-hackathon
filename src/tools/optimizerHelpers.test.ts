import {
  calculateJobCost,
  isDeadlineMet,
  findCheapestValidWindow,
  MachineJob,
  HourlyPrice,
} from "./optimizerHelpers";

// Fake 24-hour price curve: cheap at night, expensive 18:00–21:00
const testPrices: HourlyPrice[] = Array.from({ length: 24 }, (_, hour) => ({
  hour,
  pricePerKwh: hour >= 18 && hour <= 21 ? 12 : 5,
}));

const testJob: MachineJob = {
  id: "job-1",
  machineName: "CNC Machine",
  durationHours: 2,
  powerDrawKw: 10,
  deadlineHour: 23,
  priority: "medium",
  latePenaltyCost: 500,
};

console.log("Cost if started at 6am:", calculateJobCost(testJob, 6, testPrices));
console.log("Cost if started at 6pm (peak):", calculateJobCost(testJob, 18, testPrices));
console.log("Deadline met at hour 20?", isDeadlineMet(testJob, 20));
console.log("Cheapest valid start hour:", findCheapestValidWindow(testJob, testPrices));
