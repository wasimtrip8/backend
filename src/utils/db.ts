import { MongoClient, Db } from "mongodb";

let db: Db;

export async function connectToDatabase(mongoUri: string, dbName: string): Promise<Db> {
  if (db) return db; // reuse existing connection
  const client = new MongoClient(mongoUri);
  await client.connect();
  db = client.db(dbName);
  console.log(`✅ Connected to MongoDB: ${dbName}`);
  return db;
}

export function getDb(): Db {
  if (!db) {
    throw new Error("❌ Database not connected. Call connectToDatabase first.");
  }
  return db;
}
