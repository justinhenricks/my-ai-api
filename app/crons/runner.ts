import cron from "node-cron";
import { constructGigsJson } from "./construct-gigs-json.cron";
import { doEmbeddings } from "./do-embeddings.cron";

/**
 * Upsert gigs.json from google calendar events once an hour
 */
cron.schedule("0 * * * *", constructGigsJson);

// For testing, once every 15 seconds:
// cron.schedule("*/45 * * * * *", doEmbeddings);

// Run the `doEmbeddings` function every 6 hours
cron.schedule("0 0,6,12,18 * * *", doEmbeddings);
