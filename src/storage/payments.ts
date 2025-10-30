import { Db, ObjectId, WithId } from "mongodb";
import { IPayment, PaymentStatus } from "../models/payments";


export class PaymentsStorage {
    private db: Db;
    private collectionName = "payments";

    constructor(db: Db) {
        this.db = db;
    }

    public async create(data: Partial<IPayment>): Promise<WithId<IPayment>> {
        const doc: IPayment = {
            ...data,
            created_at: new Date(),
            modified_at: new Date(),
        } as IPayment;

        const result = await this.db.collection<IPayment>(this.collectionName).insertOne(doc as IPayment);
        return { ...doc, _id: result.insertedId };
    }

    public async findOne(filter: Partial<IPayment>): Promise<IPayment | null> {
        return this.db.collection<IPayment>(this.collectionName).findOne(filter);
    }

    public async updateByOrderId(orderId: string, update: Partial<IPayment>): Promise<void> {
        await this.db.collection<IPayment>(this.collectionName).updateOne(
            { razorpay_order_id: orderId },
            { $set: { ...update } },
            { upsert: true }
        );
    }

    public async markCaptured(paymentId: string): Promise<void> {
        await this.db.collection<IPayment>(this.collectionName).updateOne(
            { razorpay_payment_id: paymentId },
            { $set: { status: PaymentStatus.CAPTURED, captured_at: new Date() } }
        );
    }
}
