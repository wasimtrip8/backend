import { Request, Response } from "express";
import { Db } from "mongodb";
import { ITrip } from "../models/itinerary";
import { TripStorage } from "../storage/trip";
import { Helper } from "../utils/helper";

export class Itinerary {
  private db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  // Express handler
  public generateItineraryHandler = async (req: Request, res: Response) => {
    try {
      const userData: ITrip = req.body;
      const itineraries = await Helper.generateItinerary(this.db, userData);
      return res.status(200).json(itineraries);
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: "Failed to generate itinerary", details: err.message });
    }
  };

  public getTripsHandler = async (req: Request, res: Response) => {
    try {
      // Parse pagination
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const user = req.user;

      const tripStorage = new TripStorage(this.db);

      // Pass query params into TripStorage
      const { trips, total } = await tripStorage.getTripsWithFilters({
        query: req.query,
        skip,
        limit,
        user
      });

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

      res.json({ data: trip });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch trip", details: err.message });
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
