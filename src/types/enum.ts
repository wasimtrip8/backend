export enum PlatformType {
  ADMIN_PANEL = "ADMIN PANEL",
  WEB = "WEB",
  ANDROID = "ANDROID",
  IOS = "IOS",
  MAC_OS = "MAC-OS",
  WINDOWS = "WINDOWS",
  LINUX = "LINUX",
  OTHER = "OTHER",
}

export enum ProviderType {
  LOCAL = "LOCAL",
  GOOGLE = "GOOGLE",
  FACEBOOK = "FACEBOOK",
  GITHUB = "GITHUB",
}

export enum StatusType {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}

export enum TokenStatusType {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
  EXPIRED = "EXPIRED",
}

export enum UserRole {
  MASTER = "MASTER",  // Super admin
  ADMIN = "ADMIN",
  SUB_ADMIN = "SUB_ADMIN",
  MARKETING = "MARKETING",
  SALES = "SALES",
  SUPPORT = "SUPPORT",
  VENDER = "VENDER",
  USER = "USER",  // End user / customer
}

export enum VerificationType {
  LOGIN = "LOGIN",
  REGISTRATION = "REGISTRATION",
  FORGOT_PASSWORD = "FORGOT_PASSWORD",
  CHANGE_MOBILE = "CHANGE_MOBILE",
  CHANGE_EMAIL = "CHANGE_EMAIL",
}
// src/types/auth.ts
export enum Provider {
  LOCAL = "LOCAL",
  GOOGLE = "GOOGLE",
  FACEBOOK = "FACEBOOK",
  GITHUB = "GITHUB",
}

export enum TokenStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
  EXPIRED = "EXPIRED",
}

export interface RefreshToken {
  id: string;
  user_id: string;
  platform_id: string;
  refresh_token: string;
  expires_at: Date;
  device_id?: string;
  ip_address?: string;
  provider: Provider;
  status: TokenStatus;
}

export interface AccessToken {
  id: string;
  user_id: string;
  refresh_id: string;
  access_token: string;
  device_id?: string;
  device_token?: string;
  expires_at: Date;
  ip_address?: string;
  provider: Provider;
  status: TokenStatus;
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}

export interface User {
  creator?: string;          // ObjectId of creator (nullable)
  name: string;
  mobile?: string;
  mobile_verified?: boolean;
  email?: string;
  email_verified?: boolean;
  password?: string;         // hashed password (nullable if Google login)
  google_id?: string;        // if user registered with Google
  is_verified?: boolean;
  picture?: string;
  role: UserRole;
  status: UserStatus;
  is_deleted: boolean;
  deleted_at?: Date | null;
}