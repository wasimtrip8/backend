import express from "express";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import { auth } from "./routes/auth";

dotenv.config();

const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.DB_NAME || "evse";

(async () => {
  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db(dbName);
  console.log("Connected to MongoDB");

  app.use("/auth", auth(db));

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
})();