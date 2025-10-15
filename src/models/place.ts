import { Types } from "mongoose";

export interface IPlace {
  _id?: Types.ObjectId;
  name: string;
  cover?: string;
  images?: string[];
  state_id?: Types.ObjectId;
  state_name?: string;
  zipcode?: string | null;
  tags?: { name: string; icon?: string }[];
  is_deleted?: boolean;
  deleted_at?: Date | null;
  created_at?: Date;
  modified_at?: Date;
}

export enum SpotStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}

export interface ISpot {
  _id?: Types.ObjectId;
  creator?: Types.ObjectId | null;
  name: string;
  images?: string[];
  place?: { id: Types.ObjectId; name: string };
  latitude?: number;
  longitude?: number;
  status?: SpotStatus;
  tags?: { name: string; icon?: string }[];
  is_deleted?: boolean;
  deleted_at?: Date | null;
  created_at?: Date;
  modified_at?: Date;
}

export enum StateStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}

export interface IState {
  _id?: Types.ObjectId;
  name: string;
  code?: string | null;
  status?: StateStatus;
  is_deleted?: boolean;
  deleted_at?: Date | null;
  created_at?: Date;
  modified_at?: Date;
}

export enum CityStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}

export interface ICity {
  _id?: Types.ObjectId;
  state_id: Types.ObjectId;
  state_name?: string;
  name: string;
  code?: string | null;
  status?: CityStatus;
  is_deleted?: boolean;
  deleted_at?: Date | null;
  created_at?: Date;
  modified_at?: Date;
}

export enum ActivityStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}

export interface IActivity {
  _id?: Types.ObjectId;
  name: string;
  description?: string | null;
  duration?: number;
  banner?: string;
  status?: ActivityStatus;
  is_deleted?: boolean;
  deleted_at?: Date | null;
  created_at?: Date;
  modified_at?: Date;
}
