export const IS_PROD = process.env.NODE_ENV === "production";
export const PORT = process.env.PORT || 3000;
import path from "path";
export const GOOGLE_GIGS_CALENDAR_ID =
  "7850388e999a8dcb1f81ced67bfacd8bf36d959177e6bc4338a57e9b4c7bc841@group.calendar.google.com";
export const GIGS_FILE_PATH = path.join(process.cwd(), "/app/data/gigs.json");
