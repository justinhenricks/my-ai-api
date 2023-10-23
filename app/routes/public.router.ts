import express from "express";
import { GoogleCalendarController } from "../controllers/";
import { db } from "../db";
const router = express.Router();

router.get("/health-check", async (req, res) => {
  try {
    const userCount = await db.user.count();
    console.log("Health check ✅");
    res.json({
      message: `Alls well on the justy front.`,
    });
  } catch (error) {
    console.log("Health check ❌");
    res.status(500).json({
      message: "Something went wrong.",
    });
  }
});

router.get("/events/:gcalendar_id", GoogleCalendarController.getAllEvents);

export { router as publicRouter };
