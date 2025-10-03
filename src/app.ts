import express from "express";
import { auth } from "./routes/auth";
import { itinerary } from "./routes/itinerary";
import { quotation } from "./routes/quotation";

const app = express();
app.use(express.json());

// Routes (db is injected later in server.ts)
export function setupRoutes(db: any) {
  app.use("/auth", auth(db));
  app.use("/itinerary", itinerary(db));
  app.use("/quotation", quotation(db));
  app.get("/ping", (_req, res) => {
  res.json({ status: "alive", timestamp: new Date() });
});

}

export default app;
