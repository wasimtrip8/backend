import { Db, ObjectId, WithId } from "mongodb";
import { BookingStatus, IBooking } from "../models/bookings";

export class BookingsStorage {
  private db: Db;
  private collectionName = "bookings";

  constructor(db: Db) {
    this.db = db;
  }

  public async create(data: Partial<IBooking>): Promise<WithId<IBooking>> {
    const doc: IBooking = {
      ...data,
      created_at: new Date(),
      modified_at: new Date(),
    } as IBooking;

    const result = await this.db.collection<IBooking>(this.collectionName).insertOne(doc as IBooking);
    return { ...doc, _id: result.insertedId };
  }

  public async findOne(filter: Partial<IBooking>): Promise<IBooking | null> {
    return this.db.collection<IBooking>(this.collectionName).findOne(filter);
  }

  public async getAllByUser(user_id: ObjectId): Promise<WithId<IBooking>[]> {
    const _id = new ObjectId(user_id);
    return this.db.collection<IBooking>(this.collectionName).find({ user_id: _id }).toArray();
  }

  public async updateStatus(bookingId: ObjectId, status: BookingStatus): Promise<void> {
    await this.db.collection<IBooking>(this.collectionName).updateOne(
      { _id: bookingId },
      { $set: { status } }
    );
  }
}
