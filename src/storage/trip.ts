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

  public async updateTrip(filter: Partial<ITrip>, data: Partial<ITrip>): Promise<WithId<ITrip>> {
    const updateDoc: Partial<ITrip> = {
      ...data,
      modified_at: new Date(),
    };

    const result = await this.db.collection<ITrip>(this.collectionName).findOneAndUpdate(
      filter,
      { $set: updateDoc },
      { returnDocument: "after" } // do NOT use upsert
    );

    if (!result) {
      throw new Error("No matching trip found to update");
    }

    return result;
  }


  public async update(id: string | ObjectId, data: Partial<ITrip>): Promise<void> {
    const _id = typeof id === "string" ? new ObjectId(id) : id;
    await this.db.collection<ITrip>(this.collectionName).updateOne(
      { _id },
      { $set: { ...data, modified_at: new Date() } }
    );
  }

  async find(filter: any, options: { skip?: number; limit?: number; sort?: any } = {}) {
    let cursor = await this.db.collection<ITrip>(this.collectionName).find(filter);

    if (options.sort) cursor = cursor.sort(options.sort);
    if (options.skip) cursor = cursor.skip(options.skip);
    if (options.limit) cursor = cursor.limit(options.limit);

    return cursor.toArray();
  }

  async count(filter: Record<string, any> = {}): Promise<number> {
    return await this.db.collection<ITrip>(this.collectionName).countDocuments(filter);
  }


  public async findById(id: string | ObjectId): Promise<WithId<ITrip> | null> {
    const _id = typeof id === "string" ? new ObjectId(id) : id;
    return this.db.collection<ITrip>(this.collectionName).findOne({ _id });
  }
}
