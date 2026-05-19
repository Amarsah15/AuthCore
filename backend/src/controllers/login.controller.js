import bcrypt from "bcryptjs";
import OTP from "../models/otp.model.js";
import User from "../models/user.model.js";
import { otpTemplate } from "../utils/emailTemplate.js";
import { createLog } from "../utils/logger.utils.js";
import { sendEmail } from "../utils/sendEmail.js";
import { AppError } from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createAuthenticatedSession,
  generateHashedOtp,
  getRecentOtp,
} from "./auth.shared.js";

export const loginWithOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    await createLog({
      action: "LOGIN_OTP_REQUEST_FAILED",
      req,
      metadata: { email, reason: "User not found" },
    });

    throw new AppError("User not found", 404);
  }

  const existingOtp = await getRecentOtp(email);
  if (existingOtp && existingOtp.createdAt.getTime() > Date.now() - 60 * 1000) {
    await createLog({
      user: user._id,
      action: "LOGIN_OTP_RATE_LIMITED",
      req,
      metadata: { email },
    });

    throw new AppError("Please wait before requesting another OTP", 429);
  }

  const otp = await generateHashedOtp(email);

  await sendEmail(email, "Login OTP", otpTemplate(otp, "Login Verification"));

  await createLog({
    user: user._id,
    action: "LOGIN_OTP_SENT",
    req,
    metadata: { email },
  });

  res.json({ success: true, message: "OTP sent to email" });
});

export const verifyLoginOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const otpRecord = await OTP.findOne({ email });
  if (!otpRecord) {
    await createLog({
      action: "LOGIN_OTP_VERIFY_FAILED",
      req,
      metadata: { email, reason: "Invalid OTP" },
    });

    throw new AppError("Invalid OTP", 400);
  }

  const isMatch = await bcrypt.compare(otp, otpRecord.otp);
  if (!isMatch || otpRecord.expiresAt < new Date()) {
    await createLog({
      action: "LOGIN_OTP_VERIFY_FAILED",
      req,
      metadata: { email, reason: "Invalid or expired OTP" },
    });

    throw new AppError("Invalid or expired OTP", 400);
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  await OTP.deleteMany({ email });

  const { accessToken } = await createAuthenticatedSession(req, res, user);

  await createLog({
    user: user._id,
    action: "LOGIN_SUCCESS_OTP",
    req,
    metadata: { email },
  });

  res.json({
    success: true,
    message: "Login successful",
    accessToken,
  });
});

export const loginWithPassword = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    await createLog({
      action: "LOGIN_FAILED_PASSWORD",
      req,
      metadata: { email, reason: "User not found" },
    });

    throw new AppError("Invalid credentials", 400);
  }

  if (user.lockUntil && user.lockUntil > Date.now()) {
    await createLog({
      user: user._id,
      action: "ACCOUNT_LOCKED_LOGIN_ATTEMPT",
      req,
      metadata: { email },
    });

    throw new AppError("Account locked. Try later", 403);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    user.loginAttempts += 1;

    if (user.loginAttempts >= 5) {
      user.lockUntil = Date.now() + 15 * 60 * 1000;
    }

    await user.save();

    await createLog({
      user: user._id,
      action: "LOGIN_FAILED_PASSWORD",
      req,
      metadata: {
        email,
        loginAttempts: user.loginAttempts,
        lockedUntil: user.lockUntil,
      },
    });

    throw new AppError("Invalid credentials", 400);
  }

  user.loginAttempts = 0;
  user.lockUntil = null;

  const { accessToken } = await createAuthenticatedSession(req, res, user);

  await createLog({
    user: user._id,
    action: "LOGIN_SUCCESS_PASSWORD",
    req,
    metadata: { email },
  });

  res.json({
    success: true,
    message: "Login successful",
    accessToken,
  });
});
