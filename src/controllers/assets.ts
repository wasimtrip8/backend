import { Db } from "mongodb";
import { AssetStorage } from "../storage/assets";
import { Request, Response } from "express";
import { AssetCategory, IAsset } from "../models/assets";


export class AssetsController {
    private db: Db;
    private storage: AssetStorage;

    constructor(db: Db) {
        this.db = db;
        this.storage = new AssetStorage(db);
    }

  public getAssetsByCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { category, location } = req.query;

      // Use Record<string, any> for dynamic filter fields
      const filter: Record<string, any> = {};

      // --- Category filter ---
      if (typeof category === "string") {
        const cat = category.toUpperCase() as AssetCategory;
        if (!Object.values(AssetCategory).includes(cat)) {
          res.status(400).json({
            error: `Invalid category. Allowed: ${Object.values(AssetCategory).join(", ")}`,
          });
          return;
        }
        filter.category = cat;
      }

      // --- Location filter (matches location.place_name) ---
      if (typeof location === "string" && location.trim() !== "") {
        filter["location.place_name"] = { $regex: location, $options: "i" };
      }

      const assets = await this.storage.getAssets(filter);
      res.json({ count: assets.length, data: assets });
    } catch (err: any) {
      console.error("Error fetching assets:", err);
      res.status(500).json({ error: err.message });
    }
  };

    public getAssetPriceRange = async (req: Request, res: Response): Promise<void> => {
    try {
      const { location } = req.query;

      if (!location || typeof location !== "string") {
        res.status(400).json({ error: "location query parameter is required" });
        return;
      }

      const priceRanges = await this.storage.getPriceRangesByLocation(location);

      res.json({ location, priceRanges });
    } catch (err: any) {
      console.error("Error fetching asset price ranges:", err);
      res.status(500).json({ error: err.message });
    }
  };
}
