import { Db, ObjectId, WithId } from "mongodb";
import { AssetCategory, IAsset } from "../models/assets";

export class AssetStorage {
  private db: Db;
  private collectionName = "assets";

  constructor(db: Db) {
    this.db = db;
  }

  // Get all assets with optional filters
  public async getAssets(filter: Partial<IAsset> = {}, options?: { skip?: number; limit?: number; sort?: any }): Promise<WithId<IAsset>[]> {
    const cursor = this.db.collection<IAsset>(this.collectionName)
      .find({ ...filter, is_deleted: false });

    if (options?.skip) cursor.skip(options.skip);
    if (options?.limit) cursor.limit(options.limit);
    if (options?.sort) cursor.sort(options.sort);

    return cursor.toArray();
  }

   public async getPriceRangesByLocation(location: string): Promise<
    { category: AssetCategory; minPrice: number; maxPrice: number }[]
  > {
    const pipeline = [
      { $match: { "location.place_name": { $regex: location, $options: "i" }, is_deleted: false } },
      {
        $group: {
          _id: "$category",
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const results = await this.db.collection<IAsset>(this.collectionName).aggregate(pipeline).toArray();

    return results.map(r => ({
      category: r._id,
      minPrice: r.minPrice,
      maxPrice: r.maxPrice,
    }));
  }

  public async getMinPricesForStayAndTransport(location: string): Promise<{
    stayMinPrice: number | null;
    transportMinPrice: number | null;
  }> {
    const pipeline = [
      {
        $match: {
          "location.place_name": { $regex: location, $options: "i" },
          is_deleted: false,
          category: { $in: [AssetCategory.STAY, AssetCategory.TRANSPORT] },
        },
      },
      {
        $group: {
          _id: "$category",
          minPrice: { $min: "$price" },
        },
      },
    ];

    const results = await this.db.collection<IAsset>(this.collectionName).aggregate(pipeline).toArray();

    // Initialize defaults
    const output = {
      stayMinPrice: null,
      transportMinPrice: null,
    };

    results.forEach(r => {
      if (r._id === AssetCategory.STAY) output.stayMinPrice = r.minPrice;
      if (r._id === AssetCategory.TRANSPORT) output.transportMinPrice = r.minPrice;
    });

    return output;
  }

  // Get single asset by ID
  public async getAssetById(id: string | ObjectId): Promise<WithId<IAsset> | null> {
    const _id = typeof id === "string" ? new ObjectId(id) : id;
    return this.db.collection<IAsset>(this.collectionName).findOne({ _id, is_deleted: false });
  }

  // Create a single asset
  public async createAsset(data: IAsset): Promise<WithId<IAsset>> {
    const now = new Date();
    const insertData = {
      ...data,
      created_at: now,
      modified_at: now,
      is_deleted: false,
    };
    const result = await this.db.collection<IAsset>(this.collectionName).insertOne(insertData);
    return { ...insertData, _id: result.insertedId };
  }

  // Bulk insert assets, optionally replacing all existing assets
  public async bulkInsert(assets: IAsset[], replaceAll = false): Promise<void> {
    if (replaceAll) {
      await this.db.collection<IAsset>(this.collectionName).deleteMany({});
    }

    if (assets.length === 0) return;

    const now = new Date();
    const docs = assets.map(a => ({
      ...a,
      created_at: now,
      modified_at: now,
      is_deleted: false,
    }));

    const insertResponse = await this.db.collection<IAsset>(this.collectionName).insertMany(docs);
    console.log(insertResponse)
  }

  // Update asset by ID
  public async updateAsset(id: string | ObjectId, data: Partial<IAsset>): Promise<WithId<IAsset> | null> {
    const _id = typeof id === "string" ? new ObjectId(id) : id;
    return await this.db.collection<IAsset>(this.collectionName).findOneAndUpdate(
      { _id, is_deleted: false },
      { $set: { ...data, modified_at: new Date() } },
      { returnDocument: "after" }
    );
  }

  // Soft delete asset by ID
  public async deleteAsset(id: string | ObjectId): Promise<boolean> {
    const _id = typeof id === "string" ? new ObjectId(id) : id;
    const result = await this.db.collection<IAsset>(this.collectionName).updateOne(
      { _id, is_deleted: false },
      { $set: { is_deleted: true, deleted_at: new Date(), modified_at: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  // Check for duplicates by name & category (optional)
  public async findDuplicate(asset: IAsset): Promise<WithId<IAsset> | null> {
    return this.db.collection<IAsset>(this.collectionName).findOne({
      name: asset.name,
      category: asset.category,
      is_deleted: false
    });
  }
}
