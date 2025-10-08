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

  public async getAllByUser(user_id: string | ObjectId): Promise<WithId<IQuotation>[]> {
    const _id = typeof user_id === "string" ? new ObjectId(user_id) : user_id;
    return this.db.collection<IQuotation>(this.collectionName).find({ user_id: _id, is_deleted: false }).toArray();
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

  public async getById(id: string | ObjectId, user_id?: string | ObjectId): Promise<WithId<IQuotation> | null> {
    const _id = typeof id === "string" ? new ObjectId(id) : id;
    const filter: any = { _id, is_deleted: false };
    if (user_id) filter.user_id = typeof user_id === "string" ? new ObjectId(user_id) : user_id;

    return this.db.collection<IQuotation>(this.collectionName).findOne(filter);
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