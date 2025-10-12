//src/types/express.d.ts
import { IUser } from "../models/user";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role?: string;
        [key: string]: any;
      };
    }
  }
}
