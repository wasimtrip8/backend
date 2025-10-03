import { Db, ObjectId, WithId } from "mongodb";
import { IItinerary } from "../models/itinerary";

export class ItineraryStorage {
  private db: Db;
  private collectionName = "itineraries";

  constructor(db: Db) {
    this.db = db;
  }

  public async create(data: Partial<IItinerary>): Promise<WithId<IItinerary>> {
    const result = await this.db.collection<IItinerary>(this.collectionName).insertOne({
      ...data,
      created_at: new Date(),
      modified_at: new Date(),
    });
    return { ...data, _id: result.insertedId } as WithId<IItinerary>;
  }

  public async update(id: string | ObjectId, data: Partial<IItinerary>): Promise<void> {
    const _id = typeof id === "string" ? new ObjectId(id) : id;
    await this.db.collection<IItinerary>(this.collectionName).updateOne(
      { _id },
      { $set: { ...data, modified_at: new Date() } }
    );
  }

  public async find(query: Partial<IItinerary> = {}): Promise<WithId<IItinerary>[]> {
    return this.db.collection<IItinerary>(this.collectionName).find(query).toArray();
  }

  public async findById(id: string | ObjectId): Promise<WithId<IItinerary> | null> {
    const _id = typeof id === "string" ? new ObjectId(id) : id;
    return this.db.collection<IItinerary>(this.collectionName).findOne({ _id });
  }
}
