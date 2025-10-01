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

// Helper to create a new platform object with defaults
export function createAuthPlatform(params: Partial<IAuthPlatform>): IAuthPlatform {
  const now = new Date();
  return {
    name: params.name!,
    app_id: params.app_id,
    app_secret: params.app_secret,
    identifier: params.identifier,
    platform: params.platform!,
    status: params.status || StatusType.ACTIVE,
    is_deleted: params.is_deleted || false,
    deleted_at: params.deleted_at || null,
    created_at: now,
    modified_at: now,
  };
}

// Example usage with native MongoDB driver
// const db = getDb(); // your MongoDB database instance
// const platforms = db.collection<IAuthPlatform>("auth_platforms");
// const platform = createAuthPlatform({ name: "MyApp", platform: PlatformType.IOS });
// await platforms.insertOne(platform);
