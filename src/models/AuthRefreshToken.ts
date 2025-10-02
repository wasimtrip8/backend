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
