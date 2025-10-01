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
  USED = "USED"
}


