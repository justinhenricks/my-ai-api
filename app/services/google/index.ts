import { google } from "googleapis";

export const googleCalendarClient = google.calendar({
  auth: process.env.GOOGLE_API_KEY,
  version: "v3",
});
