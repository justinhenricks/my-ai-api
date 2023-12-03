import cron from "node-cron";
import { constructGigsJson } from "./construct-gigs-json.cron";
import { doEmbeddings } from "./do-embeddings.cron";
import { doGeminiPortfolioSummary } from "./do-gemini-portfolio-summary";

/**
 * Upsert gigs.json from google calendar events once an hour
 */
cron.schedule("0 * * * *", constructGigsJson);

// For testing, once every 15 seconds:
// cron.schedule("*/45 * * * * *", doEmbeddings);

// Run the `doEmbeddings` function every 6 hours 5 minutes past the top of the hour
cron.schedule("5 0,6,12,18 * * *", doEmbeddings);

// Do the daily gemini portfolio summary
cron.schedule("59 59 23 * * *", doGeminiPortfolioSummary);
