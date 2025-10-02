import { ObjectId } from "mongodb";
import { PlatformType, StatusType } from "../types/enum";

export interface IAuthPlatform {
  _id?: ObjectId;
  name: string;
  app_id?: string;
  app_secret?: string;
  identifier?: string;
  platform: PlatformType;
  status: StatusType;
  is_deleted: boolean;
  deleted_at?: Date | null;
  created_at?: Date;
  modified_at?: Date;
}

