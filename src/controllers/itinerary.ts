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
