import express from "express";
import { db } from "../db";
const router = express.Router();

router.get("/health-check", async (req, res) => {
  try {
    const userCount = await db.user.count();
    console.log("Health check ✅");
    res.json({
      message: `Alls well on the western front.`,
    });
  } catch (error) {
    console.log("Health check ❌");
    res.status(500).json({
      message: "Something went wrong.",
    });
  }
});

export { router as publicRouter };
