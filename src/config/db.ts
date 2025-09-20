import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

let db: Db;

export async function connectDB(): Promise<Db> {
  if (db) return db;

  const client = new MongoClient(process.env.MONGO_URI as string);
  await client.connect();
  db = client.db(process.env.DB_NAME);
  console.log(`Connected to DB: ${process.env.DB_NAME}`);
  return db;
}
