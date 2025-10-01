import { Db, ObjectId, WithId } from "mongodb";
import { ITrip } from "../models/itinerary";

export class TripStorage {
  private db: Db;
  private collectionName = "trips";

  constructor(db: Db) {
    this.db = db;
  }

  public async create(data: Partial<ITrip>): Promise<WithId<ITrip>> {
    const result = await this.db.collection<ITrip>(this.collectionName).insertOne({
      ...data,
      created_at: new Date(),
      modified_at: new Date(),
    });
    return { ...data, _id: result.insertedId } as WithId<ITrip>;
  }

  public async update(id: string | ObjectId, data: Partial<ITrip>): Promise<void> {
    const _id = typeof id === "string" ? new ObjectId(id) : id;
    await this.db.collection<ITrip>(this.collectionName).updateOne(
      { _id },
      { $set: { ...data, modified_at: new Date() } }
    );
  }

  public async find(query: Partial<ITrip> = {}): Promise<WithId<ITrip>[]> {
    return this.db.collection<ITrip>(this.collectionName).find(query).toArray();
  }

  public async findById(id: string | ObjectId): Promise<WithId<ITrip> | null> {
    const _id = typeof id === "string" ? new ObjectId(id) : id;
    return this.db.collection<ITrip>(this.collectionName).findOne({ _id });
  }
}
