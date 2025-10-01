import jwt, { SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "secret123";

export function generateAccessToken(payload: object, expiresIn: string = "15m") {
  const options: SignOptions = { expiresIn: expiresIn as SignOptions['expiresIn'] };
  return jwt.sign(payload, JWT_SECRET as jwt.Secret, options);
}

export function generateRefreshToken(payload: object, expiresIn: string = "7d") {
  const options: SignOptions = { expiresIn: expiresIn as SignOptions['expiresIn'] };
  return jwt.sign(payload, JWT_SECRET as jwt.Secret, options);
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET as jwt.Secret);
}