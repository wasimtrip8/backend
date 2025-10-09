import path from "path";
import fs from "fs";
import { MongoClient } from "mongodb";
import { AssetStorage } from "../storage/assets";
import { IAsset } from "../models/assets";
import dotenv from "dotenv";

// Load .env
dotenv.config();

const mongoUri = process.env.MONGO_URI?? "";
if (!mongoUri) {
  console.error("❌ MONGO_URI is not defined in .env");
  process.exit(1);
}

const jsonPath = path.join(__dirname, "assets.json");

async function main() {
  if (!fs.existsSync(jsonPath)) {
    console.error("❌ assets.json not found! Run conversion first.");
    process.exit(1);
  }

  const raw = fs.readFileSync(jsonPath, "utf-8");
  const assetsRaw: any[] = JSON.parse(raw);

  const assets: IAsset[] = assetsRaw.map(row => ({
    user_id: row.user_id, // convert to ObjectId inside AssetStorage if needed
    name: row.name,
    description: row.description,
    category: row.category,
    type: row.type,
    sub_type: row.sub_type,
    banner: row.banner,
    images: row.images ?? [], // convert CSV to array
    location: row.location ?? {},
    activity: row.activity ?? {},
    price: row.price ?? 0,
    status: row.status,
    tags: row.tags ?? [],
    is_deleted: false,
    created_at: new Date(),
    modified_at: new Date(),
  }));

  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db(process.env.DB_NAME);

  const assetStorage = new AssetStorage(db);

  await assetStorage.bulkInsert(assets, true);

  console.log(`✅ Uploaded ${assets.length} assets to MongoDB`);
  process.exit(0);
}

main().catch(err => {
  console.error("❌ Upload failed:", err.message);
  process.exit(1);
});
