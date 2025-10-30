import { Db, ObjectId, WithId, ClientSession } from "mongodb";
import { BookingStatus, IBooking } from "../models/bookings";

export class BookingsStorage {
  private db: Db;
  private collectionName = "bookings";

  constructor(db: Db) {
    this.db = db;
  }

  public async create(data: Partial<IBooking>, session?: ClientSession): Promise<WithId<IBooking>> {
    const doc: IBooking = {
      ...data,
      created_at: new Date(),
      modified_at: new Date(),
    } as IBooking;

    const result = await this.db
      .collection<IBooking>(this.collectionName)
      .insertOne(doc as IBooking, { session }); // Pass session here

    return { ...doc, _id: result.insertedId };
  }

  public async findOne(filter: Partial<IBooking>, session?: ClientSession): Promise<IBooking | null> {
    return this.db
      .collection<IBooking>(this.collectionName)
      .findOne(filter, { session });
  }

  public async getAllByUser(user_id: ObjectId): Promise<WithId<IBooking>[]> {
    const _id = new ObjectId(user_id);
    return this.db
      .collection<IBooking>(this.collectionName)
      .find({ user_id: _id })
      .toArray();
  }

  public async updateStatus(bookingId: ObjectId, status: BookingStatus, session?: ClientSession): Promise<void> {
    await this.db
      .collection<IBooking>(this.collectionName)
      .updateOne(
        { _id: bookingId },
        { $set: { status, modified_at: new Date() } },
        { session }
      );
  }

  public async update(filter: Partial<IBooking>, update: Partial<IBooking>, session?: ClientSession): Promise<void> {
    const result = await this.db
      .collection<IBooking>(this.collectionName)
      .updateOne(
        filter,
        { $set: { ...update, modified_at: new Date() } },
        { session }
      );

    if (result.matchedCount === 0) {
      throw new Error('Booking not found');
    }
  }

  public async updateByOrderId(orderId: string, update: Partial<IBooking>, session?: ClientSession): Promise<void> {
    const result = await this.db
      .collection<IBooking>(this.collectionName)
      .updateOne(
        { 'razorpay.order_id': orderId },
        { $set: { ...update, modified_at: new Date() } },
        { session }
      );

    if (result.matchedCount === 0) {
      throw new Error(`Booking not found for order_id: ${orderId}`);
    }
  }
}