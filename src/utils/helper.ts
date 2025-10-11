import { response } from "express"
import { Db, ObjectId } from "mongodb"
import { callOpenAI } from "../clients/openAIClient"
import { ItineraryStorage } from "../storage/itinerary"
import { TripStorage } from "../storage/trip"
import { formatPromptForItineraryCreation, extractTextFromOpenAI, formatPromptForSuggestedPlaces } from "./formatters"
import { ITrip, IItinerary } from "../models/itinerary"

export class Helper {
  private db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  // Static core logic
  public static async generateItinerary(db: Db, userData: ITrip): Promise<IItinerary> {
    const prompt = formatPromptForItineraryCreation(userData);
    const response = await callOpenAI(prompt);
    const formattedItinerary = extractTextFromOpenAI(response);

    const itineraryStorage = new ItineraryStorage(db);
    const itineraries = await itineraryStorage.create(formattedItinerary);

    const tripStorage = new TripStorage(db);
    await tripStorage.create({ ...userData, itineraries });

    return { _id: itineraries._id };
  }

  public static async generateSuggestedPlaces(db: Db, userData: ITrip): Promise<IItinerary> {
    const prompt = formatPromptForSuggestedPlaces(userData);
    const response = await callOpenAI(prompt);
    const placeList = extractTextFromOpenAI(response);

    return placeList;
  }

  public static convertToObjectIds(ids: (ObjectId | string | undefined)[]): ObjectId[] | null {
    const objectIds = Array.from(
      new Set(
        ids
          .filter((id): id is ObjectId | string => id != null)
          .map((id) => (id instanceof ObjectId ? id.toString() : id))
      )
    ).map((id) => new ObjectId(id));

    return objectIds.length > 0 ? objectIds : null;
  }
}