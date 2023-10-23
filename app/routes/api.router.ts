import express from "express";
import { doEmbeddings } from "../crons/do-embeddings.cron";
import { ApiError } from "../utils/api-error";

const router = express.Router();

//route to fire a manual do embeddings
router.post("/do-embeddings", async (req, res, next) => {
  try {
    await doEmbeddings();
    res.status(200).json({ message: "Embeddings done!" });
  } catch (error) {
    return next(ApiError.badRequest(error));
  }
});

export { router as apiRouter };
