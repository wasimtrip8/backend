import dotenv from "dotenv";
import app, { setupRoutes } from "./app";
import { connectToDatabase } from "./utils/db";
import { MongoDBStorage } from "./utils/mongoDBStorage";
import axios from "axios";

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "trip8";
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;

(async () => {
  try {
    const db = await connectToDatabase(MONGO_URI, DB_NAME);

    // Initialize collections + indexes
    const storage = new MongoDBStorage(db);
    await storage.initializeDatabase();

    // Setup routes with db
    app.use(setupRoutes(db));

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);

      // Self-ping every 10 minutes
      setInterval(async () => {
        try {
          await axios.get(`${APP_URL}/ping`);
          console.log(`💓 Pinged ${APP_URL}/ping at ${new Date().toISOString()}`);
        } catch (err) {
          console.error("❌ Ping failed:", err);
        }
      }, 10 * 60 * 1000);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
})();
