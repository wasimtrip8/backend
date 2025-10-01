import { ObjectId } from "mongodb";
import { UserRole, StatusType } from "../types/enum";

export interface IUser {
  _id?: ObjectId;
  creator?: ObjectId | null;
  name: string;
  mobile?: string;
  mobile_verified: boolean;
  email?: string;
  email_verified: boolean;
  google_id?: string | null;
  is_verified: boolean;
  picture?: string;
  role: UserRole;
  status: StatusType;
  is_deleted: boolean;
  deleted_at?: Date | null;
  created_at?: Date;
  modified_at?: Date;
  source?: string;
}

// Helper function to create a new user object
export function createUser(params: Partial<IUser>): IUser {
  const now = new Date();
  return {
    creator: params.creator || null,
    name: params.name!,
    mobile: params.mobile!,
    mobile_verified: params.mobile_verified || false,
    email: params.email!,
    email_verified: params.email_verified || false,
    google_id: params.google_id || null,
    is_verified: params.is_verified || false,
    picture: params.picture,
    role: params.role || UserRole.USER,
    status: params.status || StatusType.ACTIVE,
    is_deleted: params.is_deleted || false,
    deleted_at: params.deleted_at || null,
    created_at: now,
    modified_at: now,
  };
}

// Example usage with native MongoDB driver:
// const db = getDb(); // your MongoDB database instance
// const users = db.collection<IUser>("users");
// const newUser = createUser({ name: "John Doe", mobile: "9876543210", email: "john@example.com" });
// await users.insertOne(newUser);
