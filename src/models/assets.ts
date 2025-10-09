import { ObjectId } from "mongodb";

// Enums
export enum AssetCategory {
  STAY = "STAY",
  TRANSPORT = "TRANSPORT",
  FOOD = "FOOD",
  EXPERIENCE = "EXPERIENCE",
}

export enum AssetStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}

export enum StayType {
  RESORT = "RESORT",
  HOTEL = "HOTEL",
  HOSTEL = "HOSTEL",
  VILLAS = "VILLAS",
  GUEST_HOUSE = "GUEST_HOUSE",
}

export enum TransportType {
  BIKE = "BIKE",
  CAR = "CAR",
  BUS = "BUS",
  TRAIN = "TRAIN",
  PLANE = "PLANE",
}

export enum FoodType {
  VEG = "VEG",
  PURE_VEG = "PURE_VEG",
  NON_VEG = "NON_VEG",
  LOCAL_CUISINES = "LOCAL_CUISINES",
  MIX = "MIX",
}

export enum CarType {
  HATCHBACK = "HATCHBACK",
  SEDAN = "SEDAN",
  COMPACT_7_SEATER = "COMPACT_7_SEATER",
  HEAVY_7_SEATER = "HEAVY_7_SEATER",
}

// Sub-documents
export interface Location {
  address?: string | null;
  place_id?: ObjectId | null;
  spot_id?: ObjectId | null;
  place_name?: string | null;
  spot_name?: string | null;
  latitude?: number;
  longitude?: number;
}

export interface Tag {
  name: string;
  icon?: string;
}

export interface Activity {
  name?: string;
  description?: string;
  [key: string]: any; // flexible
}

// Main Asset interface
export interface IAsset {
  _id?: ObjectId;
  user_id: ObjectId;
  name: string;
  description?: string;
  category: AssetCategory;
  type?: string | null;     // could map to StayType, TransportType, FoodType
  sub_type?: string | null; // specifically car_type, etc.
  banner?: string | null;
  images?: string[];        // file names
  location?: Location;
  activity?: Activity;
  price: number;
  status: AssetStatus;
  tags?: Tag[];
  is_deleted?: boolean;
  deleted_at?: Date | null;
  created_at?: Date;
  modified_at?: Date;
}
