import { Request, Response } from "express";
import { Db, ObjectId } from "mongodb";
import { ITrip } from "../models/itinerary";
import { TripStorage } from "../storage/trip";
import { ItineraryStorage } from "../storage/itinerary";
import { Helper } from "../utils/helper";
import { QuotationStorage } from "../storage/quotation";
import { UserRole } from "../types/enum";
import { parsePagination } from "../utils/pagination";
import { WishlistStorage } from "../storage/wishlist";
import unsplashClient from "../clients/unsplashClient";

export class Trip {
  private db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  // Express handler
  public generateItineraryHandler = async (req: Request, res: Response) => {
    try {
      const userData: ITrip = req.body;
      const user = req.user;
      const itineraries = await Helper.generateItinerary(this.db, userData, user);
      const banner = await unsplashClient.searchUnsplashImage(userData?.destination as string);
      return res.status(200).json({...itineraries, banner});
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: "Failed to generate itinerary", details: err.message });
    }
  };

  public getTripsHandler = async (req: Request, res: Response) => {
    try {
      const { page, limit, skip } = parsePagination(req.query);
      const user = req.user;

      let trips, total;
      const tripStorage = new TripStorage(this.db);
      const query = req.query;
      if (user?.role === UserRole.VENDOR) {
        ({ trips, total } = await tripStorage.getVendorTrips({ query, skip, limit, user }));
      } else {
        ({ trips, total } = await tripStorage.getUserTrips({ query, skip, limit }));
      }

      res.json({
        data: trips,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch trips", details: err.message });
    }
  };

  public getItineraryByIdHandler = async (req: Request, res: Response) => {
    try {
      const itineraryId = req.params.id;

      if (!itineraryId) return res.status(400).json({ error: "itineraryId is required" });

      const itineraryStorage = new ItineraryStorage(this.db);
      const itinerary = await itineraryStorage.findById(itineraryId);

      if (!itinerary) return res.status(404).json({ error: "Trip not found" });

      res.json({ data: itinerary });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch itinerary", details: err.message });
    }
  };

  public getTripByIdHandler = async (req: Request, res: Response) => {
    try {
      const tripId = req.params.id;
      const userId = (req as any).user.userId; // or from auth token

      if (!tripId) return res.status(400).json({ error: "trip_id is required" });

      const tripStorage = new TripStorage(this.db);
      const trip = await tripStorage.getTripById(tripId);

      if (!trip) return res.status(404).json({ error: "Trip not found" });

      // Log view in trip_views if user_id provided
      if (userId && trip._id) {
        await tripStorage.addTripView(trip._id, userId);
      }
      const quotationStorage = new QuotationStorage(this.db);

      // Fetch quotations for this trip
      const quotations = await quotationStorage.getQuotationsByTripId(tripId);

      res.json({ data: { ...trip, quotations } });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch trip", details: err.message });
    }
  };

  public addToWishlistHandler = async (req: Request, res: Response) => {
    try {
      const tripId = new ObjectId(req.params.id);
      const userId = new ObjectId((req as any).user.userId);

      const wishlistStorage = new WishlistStorage(this.db);

      const existing = await wishlistStorage.findOne({ trip_id: tripId, user_id: userId });

      if (existing) {
        await wishlistStorage.delete({ trip_id: tripId, user_id: userId });
        return res.json({ success: true, action: "removed" });
      } else {
        await wishlistStorage.create({ trip_id: tripId, user_id: userId });
        return res.json({ success: true, action: "added" });
      }
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: "Failed to toggle wishlist", details: err.message });
    }
  };


  public getWishlistedTripsHandler = async (req: Request, res: Response) => {
    try {
      const { page, limit, skip } = parsePagination(req.query);
      const userId = new ObjectId((req as any).user.userId);

      const wishlistStorage = new WishlistStorage(this.db);
      const tripStorage = new TripStorage(this.db);

      // 1️⃣ Get all wishlist entries for this user
      const wishlists = await wishlistStorage.getAllByUser(userId);

      const tripIds = wishlists.map((w) => w.trip_id);

      if (!tripIds) {
        return res.json({
          data: [],
          page,
          limit,
          total: 0,
          totalPages: 0,
        });
      }

      if (!tripIds) return;

      // 3️⃣ Fetch trips by these IDs
      const trips = await tripStorage.find(
        { _id: { $in: tripIds } },
        { skip, limit, sort: { created_at: -1 } }
      );
      const total = await tripStorage.count({ _id: { $in: tripIds } });

      // 4️⃣ Return paginated response
      res.json({
        data: trips,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({
        error: "Failed to fetch wishlisted trips",
        details: err.message,
      });
    }
  };
  public myCreatedTripsHandler = async (req: Request, res: Response) => {
    try {
      const { page, limit, skip } = parsePagination(req.query);
      const userId = (req as any).user.userId;
      const tripStorage = new TripStorage(this.db);

      // Fetch trips created by the logged-in user
      const filter = { creator: new ObjectId(userId) };

      const trips = await tripStorage.find(filter, {
        skip,
        limit,
        sort: { created_at: -1 },
      });

      const total = await tripStorage.count(filter);

      res.json({
        data: trips,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({
        error: "Failed to fetch created trips",
        details: err.message,
      });
    }
  };

  // inside Itinerary class
  public generateSuggestedPlacesHandler = async (req: Request, res: Response) => {
    try {
      const userData: ITrip = req.body;
      const places = await Helper.generateSuggestedPlaces(this.db, userData);
      return res.status(200).json(places);
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({
        error: "Failed to generate suggested places",
        details: err.message
      });
    }
  };
}
