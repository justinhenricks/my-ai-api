import { promises as fs } from "fs";
import { calendar_v3 } from "googleapis";
import { GIGS_FILE_PATH, GOOGLE_GIGS_CALENDAR_ID } from "../constants";
import { listEvents } from "../services";

export async function constructGigsJson() {
  console.log("Going to build my gigs.json from gigs calendar 📆");
  try {
    const gigs = await listEvents(GOOGLE_GIGS_CALENDAR_ID);
    const gigsJson = await transformGigsJson(gigs);
    fs.writeFile(GIGS_FILE_PATH, gigsJson, "utf8");
    console.log("Successfully wrote to gigs.json ✅");
  } catch (err) {
    console.error("❌ Error writing to gigs.json:", err);
  }
}

const transformGigsJson = async (
  gigs: calendar_v3.Schema$Event[] | undefined
) => {
  if (!gigs) return JSON.stringify({ gigs: [] });

  // Sort gigs by start date
  // Sort gigs by start date
  gigs.sort((a, b) => {
    const dateA = new Date(a.start?.dateTime || "");
    const dateB = new Date(b.start?.dateTime || "");
    return dateA.getTime() - dateB.getTime();
  });

  // Transform the first gig (next gig)
  const nextGig = gigs[0];
  const transformedNextGig = {
    gig: `Justins next gig is: ${nextGig.summary} at ${
      nextGig.location
    }. Scheduled for ${nextGig.start?.dateTime} to ${nextGig.end?.dateTime}. ${
      nextGig.description ? `More Details: ${nextGig.description}` : ""
    }`,
  };

  // Transform the remaining gigs
  const transformedFutureGigs = gigs.slice(1).map((gig, index) => {
    const { start, end, summary, description, location } = gig;
    return {
      gig: `${index + 2}) Future Gig for Justin on: ${
        start?.dateTime
      }, summary of event: ${summary} at ${location}. ${
        nextGig.description ? `More Details: ${nextGig.description}` : ""
      }`,
    };
  });

  return JSON.stringify({
    gigs: [transformedNextGig, ...transformedFutureGigs],
  });
};
