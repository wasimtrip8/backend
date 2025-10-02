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
