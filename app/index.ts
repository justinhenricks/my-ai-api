import "dotenv/config";
import express from "express";
import { PORT } from "./constants";
import "./crons/runner"; // This schedules the cron jobs
import { router } from "./routes";

async function main() {
  const app = express();

  app.use(router);

  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port: ${PORT}`);
  });
}

main();
