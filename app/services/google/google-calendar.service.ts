import { googleCalendarClient } from "./index";

export const listEvents = async (calendarId: string) => {
  try {
    const response = await googleCalendarClient.events.list({
      calendarId,
      timeMin: new Date().toISOString(),
      maxResults: 25,
      singleEvents: true,
      orderBy: "startTime",
    });
    return response.data.items;
  } catch (error) {
    throw error;
  }
};
