import { Db, ObjectId, WithId } from "mongodb";
import { IWishlist } from "../models/wishlist";

export class WishlistStorage {
  private db: Db;
  private collectionName = "wishlist";

  constructor(db: Db) {
    this.db = db;
  }

  public async findOne(filter: Partial<IWishlist>): Promise<IWishlist | null> {
    return this.db.collection<IWishlist>(this.collectionName).findOne(filter);
  }

  public async create(data: Partial<IWishlist>): Promise<WithId<IWishlist>> {
    const result = await this.db.collection<IWishlist>(this.collectionName).insertOne({
      ...data,
      created_at: new Date(),
    });
    return { ...data, _id: result.insertedId } as WithId<IWishlist>;
  }

  public async delete(filter: Partial<IWishlist>): Promise<void> {
    await this.db.collection<IWishlist>(this.collectionName).deleteOne(filter);
  }

  public async getAllByUser(user_id: ObjectId): Promise<WithId<IWishlist>[]> {
    const _id = new ObjectId(user_id);
    return this.db.collection<IWishlist>(this.collectionName).find({ user_id: _id }).toArray();
  }
}