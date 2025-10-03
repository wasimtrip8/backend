// src/storage/MongoDBStorage.ts
import { Db } from "mongodb";
import { quotation } from "../routes/quotation";

interface IndexDefinition {
  spec: Record<string, 1 | -1>;
  options?: Record<string, any>;
}

export class MongoDBStorage {
  private db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  async checkOrCreateCollection(collectionName: string) {
    const collections = await this.db.listCollections({ name: collectionName }).toArray();
    if (collections.length === 0) {
      console.log(`Creating collection: ${collectionName}`);
      await this.db.createCollection(collectionName);
    }
  }

  async handleIndexesInCollection(
    collectionName: string,
    indexes: IndexDefinition[]
  ) {
    const collection = this.db.collection(collectionName);

    // Fetch existing indexes
    const existingIndexes = await collection.listIndexes().toArray();

    for (const idx of indexes) {
      const alreadyExists = existingIndexes.some((ex) => {
        // Compare key spec
        const sameKeys =
          JSON.stringify(ex.key) === JSON.stringify(idx.spec);

        // Compare uniqueness if defined
        const sameUnique =
          (ex.unique || false) === (idx.options?.unique || false);

        return sameKeys && sameUnique;
      });

      if (alreadyExists) {
        continue;
      }

      try {
        await collection.createIndex(idx.spec, idx.options);
        console.log(`Index created on ${collectionName}:`, idx.spec);
      } catch (err) {
        console.error(`Failed to create index on ${collectionName}`, err);
      }
    }
  }

  async initializeDatabase() {
    const collections: Record<string, IndexDefinition[]> = {
      users: [
        { spec: { email: 1 }, options: { unique: true, sparse: true } },
        { spec: { mobile: 1 }, options: { unique: true, sparse: true } },
        { spec: { google_id: 1 }, options: { unique: true, sparse: true } },
      ],
      auth_clients: [
        { spec: { name: 1 }, options: { unique: true } },
      ],
      auth_platforms: [
        { spec: { client_id: 1, identifier: 1 }, options: { unique: true } },
        { spec: { app_id: 1 }, options: { unique: true } },
      ],
      auth_refresh_tokens: [
        { spec: { refresh_token: 1 }, options: { unique: true } },
        { spec: { user_id: 1 } },
        { spec: { platform_id: 1 } },
      ],
      auth_access_tokens: [
        { spec: { access_token: 1 }, options: { unique: true } },
        { spec: { refresh_id: 1 } },
        { spec: { user_id: 1 } },
      ],
      verification_tokens: [
        { spec: { token: 1 }, options: { unique: true } },
        { spec: { code: 1 } },
      ],
      verification: [
        { spec: { mobile_email: 1 }, options: { unique: true } },
      ],
      trips: [],
      itineraries: [],
      quotations: [],
    };

    for (const [name, indexes] of Object.entries(collections)) {
      await this.checkOrCreateCollection(name);
      await this.handleIndexesInCollection(name, indexes);
    }
  }
}