import { Db, ObjectId, WithId, ClientSession } from "mongodb";
import { IPayment, PaymentStatus } from "../models/payments";

export class PaymentsStorage {
  private db: Db;
  private collectionName = "payments";

  constructor(db: Db) {
    this.db = db;
  }

  public async create(payment: Omit<IPayment, '_id' | 'created_at' | 'modified_at'>, session?: ClientSession): Promise<WithId<IPayment>> {
    const newPayment: IPayment = {
      ...payment,
      created_at: new Date(),
      modified_at: new Date()
    };

    const result = await this.db
      .collection<IPayment>(this.collectionName)
      .insertOne(newPayment, { session });

    return { ...newPayment, _id: result.insertedId };
  }

  public async updateByOrderId(orderId: string, update: Partial<IPayment>, session?: ClientSession): Promise<void> {
    const result = await this.db
      .collection<IPayment>(this.collectionName)
      .updateOne(
        { 'razorpay.order_id': orderId },
        { $set: { ...update, modified_at: new Date() } },
        { session }
      );

    if (result.matchedCount === 0) {
      throw new Error(`Payment not found for order_id: ${orderId}`);
    }
  }

  public async update(filter: Partial<IPayment>, update: Partial<IPayment>, session?: ClientSession): Promise<void> {
    const result = await this.db
      .collection<IPayment>(this.collectionName)
      .updateOne(
        filter,
        { $set: { ...update, modified_at: new Date() } },
        { session }
      );

    if (result.matchedCount === 0) {
      throw new Error('Booking not found');
    }
  }

  public async findByOrderId(orderId: string, session?: ClientSession): Promise<IPayment | null> {
    return await this.db
      .collection<IPayment>(this.collectionName)
      .findOne({ 'razorpay.order_id': orderId }, { session });
  }

  public async findByPaymentId(paymentId: string, session?: ClientSession): Promise<IPayment | null> {
  return await this.db
    .collection<IPayment>(this.collectionName)
    .findOne({ 'razorpay.payment_id': paymentId }, { session });
}
}