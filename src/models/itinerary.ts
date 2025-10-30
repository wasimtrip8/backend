import { ObjectId } from "mongodb";
import { IQuotation } from "./quotation";

// Enums
export enum TripStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
  CANCELLED = "CANCELLED",
}

export enum ItineraryType {
  PERSONALISED = "PERSONALISED",
  QUICK = "QUICK",
}

export enum TripCategory {
  ADVENTURE = "ADVENTURE",
  LEISURE = "LEISURE",
  FAMILY = "FAMILY",
  HONEYMOON = "HONEYMOON",
  OFF_BEAT = "OFF_BEAT",
  LUXURY = "LUXURY",
}

export enum Preference {
  LOW_COST = "LOW_COST",
  VALUE_FOR_MONEY = "VALUE_FOR_MONEY",
  SUPERIOR_EXP = "SUPERIOR_EXP",
}

export enum PreferredPace {
  RELAXED = "RELAXED",
  BALANCED = "BALANCED",
  PACKED = "PACKED",
}

export enum AgeGroup {
  UP_TO_25 = "UP_TO_25",
  FROM_25_TO_35 = "25_TO_35",
  FROM_35_TO_45 = "35_TO_45",
  FROM_45_TO_55 = "45_TO_55",
  ABOVE_55 = "55_PLUS",
}

export enum PlacePreference {
  CROWDED = "CROWDED",
  OFF_BEAT = "OFF_BEAT",
  MIX = "MIX",
}

export enum FoodPreference {
  VEG = "VEG",
  PURE_VEG = "PURE_VEG",
  NON_VEG = "NON_VEG",
  LOCAL_CUISINES = "LOCAL_CUISINES",
}

export enum FoodBudget {
  BUDGET = "BUDGET",
  MID_RANGE = "MID_RANGE",
  FINE_DINING = "FINE_DINING",
}

export enum TripWorkflowStatus {
  QUERY_IN_PROGRESS = "QUERY_IN_PROGRESS",
  CREATED = "CREATED",
  QUOTE_IN_PROGRESS = "QUOTE_IN_PROGRESS",
  QUOTED = "QUOTED",
  RESERVED = "RESERVED",
  BOOKED = "BOOKED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
}

// Sub-documents
export interface ITripInfo {
  booking_id?: ObjectId;
  trip_starts_at?: Date;
  trip_ends_at?: Date;
  trip_goals?: string;
  itenary_type?: ItineraryType;
  trip_types?: TripCategory[];
  preference?: Preference;
  preferred_price?: PreferredPace;
  age_group?: AgeGroup;
  has_kids?: boolean;
  place_preference?: PlacePreference;
  place_comment?: string;
  activities?: ObjectId[]; // reference to activities collection
  additional_activity?: string;
  food_preference?: FoodPreference;
  food_budget?: FoodBudget;
  food_comment?: string;
  places?: { id: ObjectId; name: string; cover?: string }[];
  status?: TripWorkflowStatus;
  vendor_cancelled?: boolean;
}

export interface IItineraryActivity {
  time: string; // e.g., "09:00 AM"
  title: string; // short title
  location: string; // place name
  description: string; // summary
  duration: string; // e.g., "2 hours"
  tags: string[]; // tags like ["adventure", "sightseeing"]
  distanceFromPrevious: string; // e.g., "5 km"
}

export interface IItineraryDay {
  day: number; // e.g., 1
  totalDistanceCovered: string; // e.g., "25 km"
  date: string; // YYYY-MM-DD format
  activities: IItineraryActivity[];
}

export interface IItinerary {
   _id?: ObjectId;
  location?: string; // destination name
  days?: IItineraryDay[];
  created_at?: Date;
  modified_at?: Date;
}

// Main trip document
export interface ITrip {
  _id?: ObjectId;
  creator?: ObjectId;
  user_id?: ObjectId;
  destination?: string;
  days?: number;
  nights?: number;
  banner?: string;
  trip_info?: ITripInfo;
  itineraries?: IItinerary;
  quotation_info?: IQuotation;
  price?: number;
  pre_defined?: boolean;
  status?: TripStatus;
  tags?: { name: string; icon?: string }[];
  total_views?: number;
  is_deleted?: boolean;
  deleted_at?: Date;
  created_at?: Date;
  modified_at?: Date;
  wishlisted?: boolean;
}