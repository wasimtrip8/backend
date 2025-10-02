import { Request, Response } from "express";
import { Db } from "mongodb";
import { IItinerary, ITrip } from "../models/itinerary";
import { callOpenAI } from "../clients/openAIClient";
import { ItineraryStorage } from "../storage/itinerary";
import { TripStorage } from "../storage/trip";
import { formatPromptForItineraryCreation, extractTextFromOpenAI } from "../utils/formatters";

export class Itinerary {
  private db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  // Express handler
  public generateItineraryHandler = async (req: Request, res: Response) => {
    try {
      const userData: ITrip = req.body;
      const itineraries = await Itinerary.generateItinerary(this.db, userData);
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

  // Static core logic
  public static async generateItinerary(db: Db, userData: ITrip): Promise<IItinerary> {
    const prompt = formatPromptForItineraryCreation(userData);
    const response = await callOpenAI(prompt);
    const formattedItinerary = extractTextFromOpenAI(response);

    const itineraryStorage = new ItineraryStorage(db);
    const itineraries = await itineraryStorage.create(formattedItinerary);

    const tripStorage = new TripStorage(db);
    await tripStorage.create({ ...userData, itineraries });

    return itineraries;
  }
}
