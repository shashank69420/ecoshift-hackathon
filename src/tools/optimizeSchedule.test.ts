import { optimizeScheduleTool } from "./optimizeSchedule";

async function run() {
  console.log("--- Single job (job-001) ---");
  console.log(JSON.stringify(await optimizeScheduleTool.handler({ jobId: "job-001" }), null, 2));

  console.log("\n--- Full schedule ---");
  console.log(JSON.stringify(await optimizeScheduleTool.handler({}), null, 2));
}

run();
