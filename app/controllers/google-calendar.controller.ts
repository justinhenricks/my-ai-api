import type { NextFunction, Request, Response } from "express";

import { listEvents } from "../services/";
import { ApiError } from "../utils/api-error";

export class GoogleCalendarController {
  static async getAllEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const { gcalendar_id } = req.params;
      const events = await listEvents(gcalendar_id);
      res.json(events);
    } catch (error) {
      return next(ApiError.badRequest(error));
    }
  }
}
