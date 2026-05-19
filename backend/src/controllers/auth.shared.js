import bcrypt from "bcryptjs";
import otpGenerator from "otp-generator";
import OTP from "../models/otp.model.js";
import { generateTokens } from "../utils/token.utils.js";

const MAX_ACTIVE_SESSIONS = 10;
const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
};

export const generateHashedOtp = async (email) => {
  const rawOtp = otpGenerator.generate(6, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
    alphabets: false,
  });

  const hashedOtp = await bcrypt.hash(rawOtp, 10);

  await OTP.deleteMany({ email });
  await OTP.create({
    email,
    otp: hashedOtp,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  return rawOtp;
};

export const getRecentOtp = async (email) => {
  return OTP.findOne({ email }).sort({ createdAt: -1 });
};

export const createAuthenticatedSession = async (req, res, user) => {
  const { accessToken, refreshToken } = generateTokens(user);

  if (user.sessions.length >= MAX_ACTIVE_SESSIONS) {
    user.sessions.shift();
  }

  user.sessions.push({
    refreshToken,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });
  await user.save();

  res.cookie("accessToken", accessToken, {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  res.cookie("refreshToken", refreshToken, {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });

  return { accessToken, refreshToken };
};
