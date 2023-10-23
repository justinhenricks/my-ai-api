import cron from "node-cron";
import { constructGigsJson } from "./construct-gigs-json.cron";

/**
 * Upsert gigs.json from google calendar events once an hour
 */
cron.schedule("0 * * * *", constructGigsJson);
