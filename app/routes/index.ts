import express from "express";

import { publicRouter } from "./public.router";
const router = express.Router();

router.use("/public", publicRouter);

router.get("/", async (req, res) => {
  res.send("Hello Justins Personal API!");
});

export { router };
