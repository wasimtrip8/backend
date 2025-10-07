import { Request, Response } from "express";
import { QuotationStorage } from "../storage/quotation";
import { Db, ObjectId } from "mongodb";
import { TripStorage } from "../storage/trip";
import { IQuotation, QuotationStatus } from "../models/quotation";

export class QuotationController {
    private db: Db;
    private storage: QuotationStorage;

    constructor(db: Db) {
        this.db = db;
        this.storage = new QuotationStorage(db);
    }

    public createQuotation = async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.userId;
            const data = { ...req.body, creator: userId, user_id: userId, status: QuotationStatus.REQUESTED } as IQuotation;
            // Create quotation
            const quotation: IQuotation = await this.storage.create(data);
            // Dump the entire quotation into the related trip
            const tripStorage = new TripStorage(this.db);
            await tripStorage.updateTrip(
                { _id: quotation.trip_id instanceof ObjectId ? quotation.trip_id : new ObjectId(quotation.trip_id) },
                { quotation_info: quotation }
            );
            res.status(201).json(quotation);
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    };

    public getUserQuotations = async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.userId;
            const quotations = await this.storage.getAllByUser(userId);
            res.json(quotations);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    };

    public getQuotationById = async (req: Request, res: Response) => {
        try {
             const userId = (req as any).user.userId;
            const { id } = req.params;
            const quotation = await this.storage.getById(id, userId);
            if (!quotation) return res.status(404).json({ error: "Quotation not found" });
            res.json(quotation);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    };

    public deleteQuotationById = async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.userId;
            const { id } = req.params;
            const deleted = await this.storage.deleteById(id, userId);
            if (!deleted) return res.status(404).json({ error: "Quotation not found or not authorized" });
            res.json({ success: true });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    };
}
