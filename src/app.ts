import express from "express";
import authRoutes from "./routes/auth";
import { connectDB } from "./utils/db";

// Connect to the database
connectDB();

const app = express();

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

export default app;
