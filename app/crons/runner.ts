import cron from "node-cron";

// Schedule jobs
cron.schedule("*/15 * * * * *", async function () {
  console.log("running a task every 15 seconds");
});
