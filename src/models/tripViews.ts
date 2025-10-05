import { ObjectId } from "mongodb";

export interface ITripView {
  _id?: ObjectId;
  trip_id: ObjectId;
  user_id: ObjectId;
  viewed_at?: Date;
  created_at?: Date;
  modified_at?: Date;
}
