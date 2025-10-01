import express from "express";
import { auth } from "./routes/auth";

const app = express();
app.use(express.json());

// Routes (db is injected later in server.ts)
export function setupRoutes(db: any) {
  app.use("/auth", auth(db));
  app.get("/ping", (_req, res) => {
  res.json({ status: "alive", timestamp: new Date() });
});

}

export default app;
