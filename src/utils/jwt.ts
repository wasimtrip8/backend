import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "mysecret";

export const signToken = (payload: object): string => {
  return jwt.sign(payload, SECRET, { expiresIn: "1h" });
};
