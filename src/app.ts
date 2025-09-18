import express from "express";
import authRoutes from "./routes/auth";

const app = express();

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

export default app;
