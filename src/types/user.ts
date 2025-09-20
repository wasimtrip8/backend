// src/types/user.ts
export enum UserRole {
  MASTER = "MASTER",
  ADMIN = "ADMIN",
  SUB_ADMIN = "SUB_ADMIN",
  VENDOR = "VENDOR",
  USER = "USER",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}

export interface User {
  id: string;                // ObjectId as string
  creator?: string;          // ObjectId of creator (nullable)
  name: string;
  mobile: string;
  mobile_verified: boolean;
  email: string;
  email_verified: boolean;
  password?: string;         // hashed password (nullable if Google login)
  google_id?: string;        // if user registered with Google
  is_verified: boolean;
  picture?: string;
  role: UserRole;
  status: UserStatus;
  is_deleted: boolean;
  deleted_at?: Date | null;
  created_at: Date;
  modified_at: Date;
}
