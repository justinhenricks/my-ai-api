import express from "express";

import { requireAuth } from "../middleware/auth";
import { ApiError } from "../utils/api-error";
import { apiRouter } from "./api.router";
import { publicRouter } from "./public.router";
const router = express.Router();

router.use("/public", publicRouter);

router.get("/", async (req, res) => {
  res.send("Hello Justins Personal API!");
});

router.use("/api", requireAuth, apiRouter);

router.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (err instanceof ApiError) {
      const errorResponse: any = { message: err.message };
      if (err.errors) {
        errorResponse.errors = err.errors;
      }
      res.status(err.statusCode).json(errorResponse);

      return;
    }

    res.status(500).json({ message: "Internal Server Error" });
  }
);

export { router };
