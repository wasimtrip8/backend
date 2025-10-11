import { ObjectId } from "mongodb";

export interface IWishlist {
  _id?: ObjectId;
  trip_id?: ObjectId;
  user_id?: ObjectId;
  created_at?: Date;
}
