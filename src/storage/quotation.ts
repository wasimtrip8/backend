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
}