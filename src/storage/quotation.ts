import { Db, ObjectId, WithId } from "mongodb";
import { IQuotation, QuotationStatus } from "../models/quotation";

export class QuotationStorage {
  private db: Db;
  private collectionName = "quotations";

  constructor(db: Db) {
    this.db = db;
  }

  public async create(data: Partial<IQuotation>): Promise<WithId<IQuotation>> {
    const result = await this.db.collection<IQuotation>(this.collectionName).insertOne({
      ...data,
      created_at: new Date(),
      modified_at: new Date(),
    });
    return { ...data, _id: result.insertedId } as WithId<IQuotation>;
  }

  public async getQuotations(user_id: string | ObjectId): Promise<any[]> {
    const _id = typeof user_id === "string" ? new ObjectId(user_id) : user_id;

    return this.db.collection<IQuotation>(this.collectionName)
      .aggregate([
        {
          $match: {
            $or: [
              { creator: _id },
              { user_id: _id },
            ],
            is_deleted: false
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            "user.password": 0, // exclude sensitive info
          },
        },
        {
          $sort: { created_at: -1 },
        },
      ])
      .toArray();
  }


  // In QuotationStorage
  public async getVendorTripIdsByStatus(
    vendorId: string,
    status: QuotationStatus
  ): Promise<ObjectId[]> {
    const filter: any = { status, is_deleted: false };

    // Apply vendor filter only for statuses representing user actions
    if (status === QuotationStatus.QUOTE_IN_PROGRESS || status === QuotationStatus.REJECTED) {
      filter.creator = new ObjectId(vendorId);
    }

    const quotations = await this.db
      .collection<IQuotation>(this.collectionName)
      .find(filter)
      .project({ trip_id: 1 }) // only fetch trip_id
      .toArray();

    return quotations
      .map((q) => q.trip_id)
      .filter((id): id is ObjectId => !!id);
  }


  public async getQuotedTripIds(): Promise<ObjectId[]> {
    const filter: any = {
      is_deleted: false,
      status: QuotationStatus.QUOTED, // only consider quoted
    };

    const quotations = await this.db
      .collection<IQuotation>(this.collectionName)
      .find(filter)
      .project({ trip_id: 1 })
      .toArray();

    return quotations
      .map((q) => q.trip_id)
      .filter((id): id is ObjectId | string => !!id)
      .map((id) => (typeof id === "string" ? new ObjectId(id) : id));
  }

  public async getById(
    id: string | ObjectId,
    user_id?: string | ObjectId
  ): Promise<any | null> {
    const _id = typeof id === "string" ? new ObjectId(id) : id;
    const match: any = { _id, is_deleted: false };

    if (user_id) {
      match.user_id = typeof user_id === "string" ? new ObjectId(user_id) : user_id;
    }

    const result = await this.db.collection<IQuotation>(this.collectionName)
      .aggregate([
        { $match: match },
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            "user.password": 0, // exclude sensitive info
          },
        },
      ])
      .toArray();

    return result[0] || null; // return single document or null
  }


  public async deleteById(id: string | ObjectId, user_id?: string | ObjectId): Promise<boolean> {
    const _id = typeof id === "string" ? new ObjectId(id) : id;
    const filter: any = { _id, is_deleted: false };
    if (user_id) filter.user_id = typeof user_id === "string" ? new ObjectId(user_id) : user_id;

    const result = await this.db.collection<IQuotation>(this.collectionName).updateOne(
      filter,
      { $set: { is_deleted: true, deleted_at: new Date(), modified_at: new Date() } }
    );

    return result.modifiedCount > 0;
  }

  public async getQuotationsByTripId(tripId: string | ObjectId): Promise<WithId<IQuotation>[]> {
    const _id = typeof tripId === "string" ? new ObjectId(tripId) : tripId;
    return this.db.collection<IQuotation>(this.collectionName)
      .find({ trip_id: _id, is_deleted: false })
      .toArray();
  }
}