import dotenv from "dotenv";
import app, { setupRoutes } from "./app";
import { connectToDatabase } from "./utils/db";
import { MongoDBStorage } from "./utils/mongoDBStorage";

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "evse";

(async () => {
  try {
    const db = await connectToDatabase(MONGO_URI, DB_NAME);

    // Initialize collections + indexes
    const storage = new MongoDBStorage(db);
    await storage.initializeDatabase();

    // Setup routes with db
    setupRoutes(db);

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
})();
