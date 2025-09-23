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
