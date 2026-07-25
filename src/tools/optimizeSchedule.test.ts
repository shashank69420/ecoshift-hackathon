import { optimizeScheduleTool } from "./optimizeSchedule";

async function run() {
  const result = await optimizeScheduleTool.handler({ jobId: "job-1", delayHours: 2 });
  console.log(JSON.stringify(result, null, 2));
}

run();
