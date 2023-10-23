import cron from "node-cron";
import { constructGigsJson } from "./construct-gigs-json.cron";

/**
 * Upsert gigs.json from google calendar events
 */
cron.schedule("*/15 * * * * *", constructGigsJson);
