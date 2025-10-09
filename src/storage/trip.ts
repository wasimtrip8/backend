import { Db, ObjectId, WithId } from "mongodb";
import { ITrip } from "../models/itinerary";
import { ITripView } from "../models/tripViews";
import { UserRole } from "../types/enum";
import { QuotationStorage } from "./quotation";
import { QuotationStatus } from "../models/quotation";

interface TripFilterOptions {
  query: any;
  skip: number;
  limit: number;
  user: any;
}

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

  public async find(filter: any, options: { skip?: number; limit?: number; sort?: any }) {
    return this.db.collection("trips")
      .find(filter)
      .skip(options.skip || 0)
      .limit(options.limit || 0)
      .sort(options.sort || {})
      .toArray();
  }

  public async count(filter: any) {
    return this.db.collection("trips").countDocuments(filter);
  }


  public async findById(id: string | ObjectId): Promise<WithId<ITrip> | null> {
    const _id = typeof id === "string" ? new ObjectId(id) : id;
    return this.db.collection<ITrip>(this.collectionName).findOne({ _id });
  }

  public async getTripsWithFilters({ query, skip, limit, user }: TripFilterOptions) {
    const filter: any = {};

    // Location filter
    if (query.location) {
      const locations = Array.isArray(query.location)
        ? query.location
        : (query.location as string).split(",").map((s) => s.trim());

      if (locations.length > 0) {
        filter.$or = locations.flatMap((loc: any) => [
          { starting: { $regex: loc, $options: "i" } },
          { destination: { $regex: loc, $options: "i" } },
        ]);
      }
    }

    // Price filter
    if (query.price) {
      const price = parseFloat(query.price as string);
      if (!isNaN(price)) {
        filter.price = { $lte: price }; // <= price
      }
    }


    // Tags filter
    if (query.tags) {
      const tags = Array.isArray(query.tags)
        ? query.tags
        : (query.tags as string).split(",").map((s) => s.trim());

      if (tags.length > 0) {
        filter["trip_info.trip_types"] = { $in: tags };
      }
    }

    // Quotation status filter
    if (query.quotation_status && user.role === UserRole.VENDOR) {
      const quotationStorage = new QuotationStorage(this.db);

      // Get trip IDs from quotations
      const tripIds = await quotationStorage.getVendorTripIdsByStatus(
        user.userId,
        query.quotation_status as QuotationStatus
      );

      if (tripIds.length > 0) {
        // Convert all IDs to ObjectId in case they are strings
        filter._id = { $in: tripIds.map(id => new ObjectId(id)) };
      } else {
        return { trips: [], total: 0 };
      }
    }
    
    // Trending
    if (query.trending === "true") {
      return this.getTrendingTrips(filter, skip, limit);
    }

    // Normal fetch
    const trips = await this.find(filter, { skip, limit, sort: { created_at: -1 } });
    const total = await this.count(filter);

    return { trips, total };
  }

  public async getTrendingTrips(filter: any, skip: number, limit: number) {
    const tripViewsColl = this.db.collection("trip_views");

    const pipeline = [
      { $group: { _id: "$trip_id", viewCount: { $sum: 1 } } },
      { $sort: { viewCount: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];

    const trending = await tripViewsColl.aggregate(pipeline).toArray();
    const tripIds = trending.map((t) => t._id);

    // fetch trips by these IDs
    const trips = await this.find(
      { ...filter, _id: { $in: tripIds } },
      { skip: 0, limit: tripIds.length }
    );

    // keep order same as trending result
    const tripMap = new Map(trips.map((t) => [t._id.toString(), t]));
    const sortedTrips = tripIds.map((id) => tripMap.get(id.toString())).filter(Boolean);

    // total trending count (unique trip_ids in trip_views)
    const total = await tripViewsColl.distinct("trip_id").then((arr) => arr.length);

    return { trips: sortedTrips, total };
  }

  async getTripById(tripId: string | ObjectId): Promise<ITrip | null> {
    const _id = typeof tripId === "string" ? new ObjectId(tripId) : tripId;
    return this.db.collection<ITrip>(this.collectionName).findOne({ _id });
  }

  async addTripView(tripId: ObjectId, userId: ObjectId) {
    const tripViewsColl = this.db.collection<ITripView>("trip_views");
    const now = new Date();

    const view: ITripView = {
      trip_id: typeof tripId === "string" ? new ObjectId(tripId) : tripId,
      user_id: typeof userId === "string" ? new ObjectId(userId) : userId,
      viewed_at: now,
      created_at: now,
      modified_at: now
    };

    await tripViewsColl.insertOne(view);
  }

}
