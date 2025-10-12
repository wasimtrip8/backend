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
  user?: any;
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

  public async getVendorTrips({ query, skip, limit, user }: TripFilterOptions) {
    const filter: any = {};
    const quotationStorage = new QuotationStorage(this.db);

    if (query.quotation_status) {
      const tripIds = await quotationStorage.getVendorTripIdsByStatus(
        user.userId,
        query.quotation_status as QuotationStatus
      );

      if (tripIds.length > 0) {
        filter._id = { $in: tripIds.map((id) => new ObjectId(id)) };
      } else {
        return { trips: [], total: 0 };
      }
    }

    const trips = await this.find(filter, { skip, limit, sort: { created_at: -1 } });
    const total = await this.count(filter);

    return { trips, total };
  }


  public async getUserTrips({ query, skip, limit }: TripFilterOptions) {
    const filter: any = {};

    // --- Location filter ---
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

    if (query.price) {
      const price = parseFloat(query.price as string);
      if (!isNaN(price)) {
        filter.price = { $lte: price };
      }
    }


    // --- Tags filter ---
    if (query.tags) {
      const tags = Array.isArray(query.tags)
        ? query.tags
        : (query.tags as string).split(",").map((s) => s.trim());

      if (tags.length > 0) {
        filter["trip_info.trip_types"] = { $in: tags };
      }
    }

    // --- Only trips that have quotations ---
    const quotationStorage = new QuotationStorage(this.db);
    const quotedTripIds = await quotationStorage.getQuotedTripIds();

    if (quotedTripIds.length === 0) {
      return { trips: [], total: 0 };
    }

    filter._id = { $in: quotedTripIds };

    // --- Trending filter ---
    if (query.trending === "true") {
      // Intersect trending trips with quoted trips
      const { trips: trendingTrips, total: trendingTotal } = await this.getTrendingTrips(
        filter,
        skip,
        limit
      );

      return { trips: trendingTrips, total: trendingTotal };
    }

    // --- Normal fetch ---
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

    // fetch trips by these IDs, respecting existing filters
    const trips = await this.find(
      { ...filter, _id: { $in: tripIds.filter((id) => filter._id?.$in.some((qid: ObjectId) => qid.equals(id))) } },
      { skip: 0, limit: tripIds.length }
    );

    // preserve order
    const tripMap = new Map(trips.map((t) => [t._id.toString(), t]));
    const sortedTrips = tripIds.map((id) => tripMap.get(id.toString())).filter(Boolean);

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
