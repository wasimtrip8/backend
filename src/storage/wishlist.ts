import { Db, ObjectId, WithId } from "mongodb";
import { IWishlist } from "../models/wishlist";

export class WishlistStorage {
  private db: Db;
  private collectionName = "wishlist";

  constructor(db: Db) {
    this.db = db;
  }

  public async create(data: Partial<IWishlist>): Promise<WithId<IWishlist>> {
    const result = await this.db.collection<IWishlist>(this.collectionName).insertOne({
      ...data,
      created_at: new Date(),
    });
    return { ...data, _id: result.insertedId } as WithId<IWishlist>;
  }

    public async getAllByUser(user_id: ObjectId): Promise<WithId<IWishlist>[]> {
      const _id = new ObjectId(user_id) ;
      return this.db.collection<IWishlist>(this.collectionName).find({ user_id: _id}).toArray();
    }
}