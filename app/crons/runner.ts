import { promises as fs } from "fs";
import { calendar_v3 } from "googleapis";
import cron from "node-cron";
import { GIGS_FILE_PATH, GOOGLE_GIGS_CALENDAR_ID } from "../constants";
import { listEvents } from "../services";
/**
 * Upsert gigs.json from google calendar events
 */
cron.schedule("*/15 * * * * *", async function () {
  console.log("Going to build my gigs.json from gigs calendar 📆");

  try {
    const gigs = await listEvents(GOOGLE_GIGS_CALENDAR_ID);
    const gigsJson = await getGigsJSONForEmbeddings(gigs);
    fs.writeFile(GIGS_FILE_PATH, gigsJson, "utf8");
    console.log("Successfully wrote to gigs.json");
  } catch (err) {
    console.error("Error writing to gigs.json:", err);
  }
});

const getGigsJSONForEmbeddings = async (
  gigs: calendar_v3.Schema$Event[] | undefined
) => {
  if (!gigs) return JSON.stringify({ gigs: [] });

  const transformedGigs = gigs.map((gig) => {
    const { start, end, summary, description, location } = gig;
    return {
      gig: `Upcoming Gig Event Details - Title: ${summary} - Description: ${description} - Location: ${location} - Start Date and Time: ${start?.dateTime} - End Date and Time: ${end?.dateTime}`,
    };
  });

  return JSON.stringify({ transformedGigs });
};
