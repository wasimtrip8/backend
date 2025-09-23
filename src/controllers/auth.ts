//src/controllers/auth.ts
import { Request, Response } from "express";
import { Db, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { UserRole, StatusType, TokenStatus, TokenStatusType, VerificationType } from "../types/enum";
import { AuthAccessToken, User, Verification } from "../models";
import AuthRefreshToken, { IAuthRefreshToken } from "../models/AuthRefreshToken";
import { IUser } from "../models/User";
import authAccessToken, { IAuthAccessToken } from "../models/AuthAccessToken";
import mongoose from "mongoose";
import { IVerificationToken } from "../models/VerificationToken";
import * as crypto from "crypto";
export class Auth {
  private db: Db;

  constructor(db: Db) {
    this.db = db;
  }
register = async (req: Request, res: Response) => {
    try {
      const existingUser = await User.findOne({ email: req.body.email });  // ✅ correct usage
      if (existingUser) return res.status(400).json({ error: "User already exists" });

      const hashedPassword = await bcrypt.hash(req.body.password, 10);

      const user: IUser = new User({
        ...req.body,
        role: UserRole.USER,
        password: hashedPassword,
        is_deleted: false,
        status: StatusType.ACTIVE,
      });

      await user.save();

      res.status(201).json({ message: "User registered", userId: user._id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  // Login
  login = async (req: Request, res: Response) => {
    try {
      const { email, password, platform_id } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ error: "User not found" });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ error: "Invalid credentials" });

      // Generate tokens
      const accessToken = generateAccessToken({ userId: user._id });
      const refreshToken = generateRefreshToken({ userId: user._id });

      // Save refresh token
      const refreshResult: IAuthRefreshToken = await AuthRefreshToken.insertOne({
        user_id: user._id,
        platform_id: new ObjectId(platform_id),
        refresh_token: refreshToken,
        status: TokenStatus.ACTIVE
      });

      // Save access token
      await AuthAccessToken.insertOne({
        user_id: user._id,
        refresh_id: refreshResult._id,
        access_token: accessToken,
        status: TokenStatus.ACTIVE
      } as unknown as IAuthAccessToken);

      res.json({ accessToken, refreshToken });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  // Refresh Token
  refresh = async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;

      const stored = await AuthRefreshToken.findOne({ refresh_token: refreshToken, status: TokenStatus.ACTIVE });
      if (!stored) return res.status(401).json({ error: "Invalid refresh token" });

      const newAccessToken = generateAccessToken({ userId: stored.user_id });

      await authAccessToken.insertOne({
        user_id: stored.user_id,
        refresh_id: stored._id,
        access_token: newAccessToken,
        status: TokenStatus.ACTIVE
      });

      res.json({ accessToken: newAccessToken });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  // ---------- OTP endpoints (new) ----------
  /**
   * POST /auth/otp/send
   * body: { mobile_email: string, platform_id?: string, verification_type?: string }
   */
  sendOtp = async (req: Request, res: Response) => {
    try {
      const { mobile_email, platform_id, verification_type } = req.body;
      if (!mobile_email) return res.status(400).json({ error: "mobile_email is required" });

      // generate numeric 6-digit code and opaque token
      const code = Math.floor(100000 + Math.random() * 900000).toString(); 
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      const tokenObj: Partial<IVerificationToken> = {
        platform_id: platform_id ? new mongoose.Types.ObjectId(platform_id) : undefined,
        verification_type: verification_type || VerificationType.LOGIN,
        token,
        code,
        verify_attempts: 0,
        resend_attempts: 0,
        expires_at: expiresAt,
        status: TokenStatusType.ACTIVE,
      };

      let verification = await Verification.findOne({ mobile_email });
      if (!verification) {
        verification = new Verification({
          mobile_email,
          tokens: [tokenObj],
          status: TokenStatusType.ACTIVE,
        });
      } else {
        verification.tokens.push(tokenObj as any);
        verification.status = TokenStatusType.ACTIVE;
      }

      await verification.save();

      return res.status(200).json({ message: "OTP sent", sent: true, otp:code });
    } catch (err) {
      console.error("sendOtp error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };

  /**
   * POST /auth/otp/verify
   * body: { mobile_email: string, code: string }
   *
   * Marks the token used and optionally issues JWT if a user exists with that mobile/email.
   */
verifyOtp = async (req: Request, res: Response) => {
  try {
    const { mobile_email, code, platform_id } = req.body;
    if (!mobile_email || !code) {
      return res.status(400).json({ error: "mobile_email and code are required" });
    }

    const verification = await Verification.findOne({ mobile_email });
    if (!verification) return res.status(404).json({ error: "No OTP request found" });

    // find latest matching active token
    const tokens = verification.tokens || [];
    let foundIdx = -1;
    for (let i = tokens.length - 1; i >= 0; i--) {
      const t = tokens[i] as IVerificationToken & any;
      if (t.code === code && t.status === TokenStatusType.ACTIVE) {
        foundIdx = i;
        break;
      }
    }

    if (foundIdx === -1) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    const tokenDoc = verification.tokens[foundIdx] as any as IVerificationToken;

    // expiry check
    if (tokenDoc.expires_at && tokenDoc.expires_at.getTime() < Date.now()) {
      tokenDoc.status = TokenStatusType.EXPIRED;
      await verification.save();
      return res.status(400).json({ error: "OTP expired" });
    }

    // mark OTP as USED
    tokenDoc.status = TokenStatusType.ACTIVE;
    await verification.save();

    // find user by mobile OR email
    let user = await User.findOne({ mobile: mobile_email }) 
             || await User.findOne({ email: mobile_email });

    if (!user) {
      return res.status(200).json({
        message: "OTP verified, but no user found. Continue with registration.",
        otpVerified: true,
        requiresRegistration: true
      });
    }

    // generate tokens
    const accessToken = generateAccessToken({ userId: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user._id, role: user.role });

    // persist refresh token
    const refreshResult: IAuthRefreshToken = await AuthRefreshToken.insertOne({
      user_id: user._id,
      platform_id: platform_id ? new ObjectId(platform_id) : undefined,
      refresh_token: refreshToken,
      status: TokenStatus.ACTIVE
    });

    // persist access token
    await AuthAccessToken.insertOne({
      user_id: user._id,
      refresh_id: refreshResult._id,
      access_token: accessToken,
      status: TokenStatus.ACTIVE
    } as unknown as IAuthAccessToken);

    return res.status(200).json({
      message: "OTP verified",
      accessToken,
      refreshToken,
      userId: user._id
    });
  } catch (err) {
    console.error("verifyOtp error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};


  /**
   * POST /auth/otp/resend
   * body: { mobile_email: string }
   * Increments resend_attempts on last token and simulates resend.
   */
  resendOtp = async (req: Request, res: Response) => {
    try {
      const { mobile_email } = req.body;
      if (!mobile_email) return res.status(400).json({ error: "mobile_email is required" });

      const verification = await Verification.findOne({ mobile_email });
      if (!verification) return res.status(404).json({ error: "No OTP request found" });

      const tokens = verification.tokens || [];
      if (tokens.length === 0) return res.status(400).json({ error: "No OTP to resend" });

      const lastToken = tokens[tokens.length - 1] as any as IVerificationToken;

      const MAX_RESENDS = 3;
      lastToken.resend_attempts = (lastToken.resend_attempts || 0) + 1;

      if (lastToken.resend_attempts > MAX_RESENDS) {
        return res.status(429).json({ error: "Resend limit reached" });
      }

      // extend expiry
      lastToken.expires_at = new Date(Date.now() + 5 * 60 * 1000);
      await verification.save();

      return res.status(200).json({ message: "OTP resent", otp: lastToken.code, resendAttempts: lastToken.resend_attempts });
    } catch (err) {
      console.error("resendOtp error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };

  // OTP Login (shortcut: send + verify in one flow)
otpLogin = async (req: Request, res: Response) => {
  try {
    const { mobile_email, code, platform_id } = req.body;
    if (!mobile_email || !code) {
      return res.status(400).json({ error: "mobile_email and code are required" });
    }

    // find verification entry
    const verification = await Verification.findOne({ mobile_email });
    if (!verification) return res.status(404).json({ error: "No OTP request found" });

    // find latest active token with matching code
    const tokens = verification.tokens || [];
    const tokenDoc = tokens.reverse().find(
      (t: any) => t.code === code && t.status === TokenStatusType.ACTIVE
    ) as IVerificationToken | undefined;

    if (!tokenDoc) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // expiry check
    if (tokenDoc.expires_at && tokenDoc.expires_at.getTime() < Date.now()) {
      tokenDoc.status = TokenStatusType.EXPIRED;
      await verification.save();
      return res.status(400).json({ error: "OTP expired" });
    }

    // mark OTP as used
    tokenDoc.status = TokenStatusType.ACTIVE;
    await verification.save();

    // locate user by mobile/email
    const user =
      (await User.findOne({ mobile: mobile_email })) ||
      (await User.findOne({ email: mobile_email }));

    if (!user) {
      return res.status(200).json({
        message: "OTP verified, but no user found",
        otpVerified: true,
        requiresRegistration: true,
      });
    }

    // generate tokens
    const accessToken = generateAccessToken({ userId: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user._id, role: user.role });

    // persist refresh token
    const refreshResult: IAuthRefreshToken = await AuthRefreshToken.insertOne({
      user_id: user._id,
      platform_id: platform_id ? new ObjectId(platform_id) : undefined,
      refresh_token: refreshToken,
      status: TokenStatus.ACTIVE,
    });

    // persist access token
    await AuthAccessToken.insertOne({
      user_id: user._id,
      refresh_id: refreshResult._id,
      access_token: accessToken,
      status: TokenStatus.ACTIVE,
    } as unknown as IAuthAccessToken);

    return res.status(200).json({
      message: "OTP login successful",
      accessToken,
      refreshToken,
      userId: user._id,
    });
  } catch (err) {
    console.error("otpLogin error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

}