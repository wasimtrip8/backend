import { Request, Response } from "express";
import { UserStorage } from "../storage/user";
import { Db } from "mongodb";

export class UserController {
  private db: Db;
  private storage: UserStorage;

  constructor(db: Db) {
    this.db = db;
    this.storage = new UserStorage(db);
  }

  // GET current user
  public getUser = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId; // assuming authenticateJWT sets req.user.userId
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await this.storage.getUserById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      res.json(user);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  // UPDATE current user
  public updateUser = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const updated = await this.storage.updateUser(userId, req.body);
      res.json(updated);
    } catch (err: any) {
      if (err.message.includes("No matching user found")) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(500).json({ error: err.message });
    }
  };
}
