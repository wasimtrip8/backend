import { Request, Response } from "express";
import { QuotationStorage } from "../storage/quotation";
import { Db, ObjectId } from "mongodb";
import { IQuotation, QuotationStatus } from "../models/quotation";
import { UserRole } from "../types/enum";
import { TripStorage } from "../storage/trip";

export class QuotationController {
    private db: Db;
    private storage: QuotationStorage;

    constructor(db: Db) {
        this.db = db;
        this.storage = new QuotationStorage(db);
    }

    public createQuotation = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const userId = user.userId;
            const userRole = user.role;

            const tripStorage = new TripStorage(this.db);
            const trip = await tripStorage.getTripById(req.body.trip_id);
            if (!trip) {
                return res.status(404).json({ error: 'Trip not found' });
            }

            // Determine quotation status based on user role
            let status: QuotationStatus;
            let tripId = req.body.trip_id; // default to existing trip_id

            if (userRole === UserRole.VENDOR) {
                status = QuotationStatus.QUOTE_IN_PROGRESS;
            } else {
                status = QuotationStatus.REQUESTED;
                // If current user is not the trip creator, create a duplicate under their ID
                if (userId !== trip.creator?.toString()) {
                    const newTrip = await tripStorage.create({
                        ...trip,
                        _id: undefined,
                        creator: userId,
                        user_id: userId,
                        created_at: new Date(),
                    });

                    tripId = newTrip._id; // use new trip’s ID for quotation
                }
            }

            // Prepare quotation data
            const data: IQuotation = {
                ...req.body,
                trip_id: new ObjectId(tripId),
                creator: trip.creator,
                user_id: new ObjectId(userId),
                created_at: new Date(),
                status,
            };

            // Create quotation
            const quotation = await this.storage.create(data);

            return res.status(200).json({ _id: quotation._id });
        } catch (err: any) {
            return res.status(400).json({ error: err.message });
        }
    };



    public quoteOrRejectQuotation = async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.userId;
            const quotationId = req.params.id;

            // Determine new status from route
            let status: QuotationStatus;
            if (req.path.includes("quote")) {
                status = QuotationStatus.QUOTE_IN_PROGRESS;
            } else if (req.path.includes("reject")) {
                status = QuotationStatus.REJECTED;
            } else {
                return res.status(400).json({ error: "Invalid route" });
            }

            // Fetch original quotation
            const original = await this.storage.getById(quotationId);
            if (!original) return res.status(404).json({ error: "Quotation not found" });

            // Clone and update fields
            const newQuotation: IQuotation = {
                ...original,
                _id: undefined,
                user_id: new ObjectId(userId),
                status,
                created_at: new Date(),
                modified_at: new Date(),
            };

            const inserted = await this.storage.create(newQuotation);

            res.status(200).json({ _id: inserted._id });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    };


    public getUserQuotations = async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.userId;
            const quotations = await this.storage.getQuotations(userId);
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
