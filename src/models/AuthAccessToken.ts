import { ObjectId } from "mongodb";
import { ProviderType, TokenStatus } from "../types/enum";

export interface IAuthAccessToken {
  user_id: ObjectId;
  refresh_id: ObjectId;
  access_token: string;
  device_id?: string;
  device_token?: string;
  expires_at: Date;
  ip_address?: string;
  provider: ProviderType;
  status: TokenStatus;
  created_at?: Date;
  modified_at?: Date;
}

// Helper function to create a new access token object
export function createAuthAccessToken(params: Partial<IAuthAccessToken>): IAuthAccessToken {
  const now = new Date();
  return {
    user_id: params.user_id!,
    refresh_id: params.refresh_id!,
    access_token: params.access_token || "",
    device_id: params.device_id,
    device_token: params.device_token,
    expires_at: params.expires_at || new Date(now.getTime() + 60 * 60 * 1000), // default 1 hour
    ip_address: params.ip_address,
    provider: params.provider || ProviderType.LOCAL,
    status: params.status || TokenStatus.ACTIVE,
    created_at: now,
    modified_at: now,
  };
}
