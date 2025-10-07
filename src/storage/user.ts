import { Db, ObjectId, WithId } from "mongodb";
import { IUser } from "../models/user";

export class UserStorage {
    private db: Db;
    private collectionName = "users";

    constructor(db: Db) {
        this.db = db;
    }

    // Get single user by ID
    async getUserById(id: string): Promise<IUser | null> {
        return this.db
            .collection<IUser>(this.collectionName)
            .findOne({ _id: new ObjectId(id), is_deleted: false });
    }

    // Update user by ID
    async updateUser(id: string, data: Partial<IUser>): Promise<WithId<IUser>> {
        const updateDoc: Partial<IUser> = {
            ...data,
            modified_at: new Date(),
        };

        const result = await this.db.collection<IUser>(this.collectionName).findOneAndUpdate(
            { _id: new ObjectId(id), is_deleted: false },
            { $set: updateDoc },
            { returnDocument: "after" }
        );

        if (!result) {
            throw new Error("No matching trip found to update");
        }

        return result;
    }
}
