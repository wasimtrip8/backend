import express from "express";
import cors from "cors";
import { setupRoutes } from "./routes/router";

const app = express();

// Enable CORS for your frontend
app.use(cors({
  origin: "*", // frontend URL
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
}));

app.use(express.json());

// Note: routes are now mounted in server.ts after DB is connected

export default app;
export { setupRoutes };
