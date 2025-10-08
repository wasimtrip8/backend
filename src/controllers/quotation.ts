import { Request, Response } from "express";
import { QuotationStorage } from "../storage/quotation";
import { Db, ObjectId } from "mongodb";
import { TripStorage } from "../storage/trip";
import { IQuotation, QuotationStatus } from "../models/quotation";
import { UserRole } from "../types/enum";

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
            const userRole = (req as any).user.role;

            // Decide initial quotation status based on role
            let status: QuotationStatus;
            if (userRole === UserRole.VENDOR) {
                status = QuotationStatus.QUOTE_IN_PROGRESS;
            } else {
                status = QuotationStatus.REQUESTED;
            }

            const data: IQuotation = {
                ...req.body,
                creator: userId,
                user_id: userId,
                status,
            };
            // Create quotation
            const quotation: IQuotation = await this.storage.create(data);

            res.status(200).json({_id: quotation._id});
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
