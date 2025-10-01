import { ObjectId } from "mongodb";
import { ProviderType, TokenStatus } from "../types/enum";

export interface IAuthRefreshToken {
  _id?: ObjectId;
  user_id: ObjectId;
  platform_id: ObjectId | null;
  refresh_token: string;
  expires_at: Date;
  device_id?: string;
  ip_address?: string;
  provider: ProviderType;
  status: TokenStatus;
  created_at?: Date;
  modified_at?: Date;
}

// Helper function to create a new refresh token object
export function createAuthRefreshToken(params: Partial<IAuthRefreshToken>): IAuthRefreshToken {
  const now = new Date();
  return {
    user_id: params.user_id!,
    platform_id: params.platform_id!,
    refresh_token: params.refresh_token || "",
    expires_at: params.expires_at || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // default 30 days
    device_id: params.device_id,
    ip_address: params.ip_address,
    provider: params.provider!,
    status: params.status || TokenStatus.ACTIVE,
    created_at: now,
    modified_at: now,
  };
}

// Example usage with native MongoDB driver:
// const db = getDb(); // MongoDB database instance
// const refreshTokens = db.collection<IAuthRefreshToken>("auth_refresh_tokens");
// const token = createAuthRefreshToken({ user_id, platform_id, refresh_token, provider });
// await refreshTokens.insertOne(token);
