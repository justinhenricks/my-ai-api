import "dotenv/config";
import express from "express";
import { PORT } from "./contants";

async function main() {
  const app = express();

  app.get("/", async (req, res) => {
    res.send("Hello World!");
  });

  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port: ${PORT}`);
  });
}

main();
