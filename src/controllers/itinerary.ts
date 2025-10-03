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
      // Parse locations from query
      let locations: string[] = [];
      if (req.query.location) {
        if (Array.isArray(req.query.location)) {
          locations = req.query.location as string[];
        } else {
          locations = (req.query.location as string).split(",").map(s => s.trim());
        }
      }

      // Build MongoDB filter
      const filter: any = {};
      if (locations.length > 0) {
        filter.$or = locations.flatMap(loc => [
          { starting: { $regex: loc, $options: "i" } },
          { destination: { $regex: loc, $options: "i" } }
        ]);
      }

      // Pagination
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const tripStorage = new TripStorage(this.db);
      const trips = await tripStorage.find(filter, { skip, limit, sort: { created_at: -1 } });
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
      res.status(500).json({ error: "Failed to fetch trips", details: err.message });
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
