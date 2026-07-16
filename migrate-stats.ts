import { recalculateAllPlayerStats } from "./src/lib/stats";

async function run() {
  console.log("Starting recalculation of player stats...");
  await recalculateAllPlayerStats();
  console.log("Done.");
}

run().catch(console.error);
