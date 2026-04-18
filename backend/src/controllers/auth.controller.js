import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import otpGenerator from "otp-generator";
import { generateSecret, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";
import OTP from "../models/otp.model.js";
import User from "../models/user.model.js";
import { otpTemplate } from "../utils/emailTemplate.js";
import { createLog } from "../utils/logger.utils.js";
import { sendEmail } from "../utils/sendEmail.js";
import { generateTokens } from "../utils/token.utils.js";
import { AppError } from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const MAX_ACTIVE_SESSIONS = 10;
const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const OAUTH_STATE_MAX_AGE = 10 * 60 * 1000;
const OAUTH_PROVIDER_COOKIE_MAX_AGE = 10 * 60 * 1000;
const TWO_FACTOR_TOKEN_MAX_AGE = "10m";
const TWO_FACTOR_COOKIE_NAME = "xOauthCodeVerifier";
const FRONTEND_APP_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const GOOGLE_OAUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";
const X_OAUTH_URL = "https://twitter.com/i/oauth2/authorize";
const X_TOKEN_URL = "https://api.x.com/2/oauth2/token";
const X_USERINFO_URL = "https://api.x.com/2/users/me";
const OAUTH_STATE_SECRET =
  process.env.OAUTH_STATE_SECRET || process.env.ACCESS_TOKEN_SECRET;
const TWO_FACTOR_TOKEN_SECRET =
  process.env.TWO_FACTOR_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET;
const TOTP_ISSUER = process.env.TOTP_ISSUER || "AuthCore";
const ALLOWED_FRONTEND_ORIGINS = Array.from(
  new Set(
    [
      process.env.CORS_ORIGINS,
      process.env.FRONTEND_URL,
      "http://localhost:5173",
    ]
      .filter(Boolean)
      .flatMap((value) => value.split(","))
      .map((origin) => origin.trim())
      .filter(Boolean),
  ),
);
const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
};

const TOTP_OPTIONS = {
  strategy: "totp",
  digits: 8,
  period: 30,
  epochTolerance: 1,
};

const verifyTotpCode = (code, secret) => {
  return verifySync({
    ...TOTP_OPTIONS,
    token: String(code).trim(),
    secret,
  });
};

const normalizeOrigin = (value) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const resolveFrontendOrigin = (req) => {
  const requestedOrigin = normalizeOrigin(req.query.frontendOrigin);
  if (requestedOrigin && ALLOWED_FRONTEND_ORIGINS.includes(requestedOrigin)) {
    return requestedOrigin;
  }

  const requestOrigin = normalizeOrigin(req.get("origin"));
  if (requestOrigin && ALLOWED_FRONTEND_ORIGINS.includes(requestOrigin)) {
    return requestOrigin;
  }

  return FRONTEND_APP_URL;
};

const createOAuthState = (provider, frontendOrigin) => {
  return jwt.sign({ provider, frontendOrigin }, OAUTH_STATE_SECRET, {
    expiresIn: `${OAUTH_STATE_MAX_AGE / 1000}s`,
  });
};

const verifyOAuthState = (state, provider) => {
  const decoded = jwt.verify(state, OAUTH_STATE_SECRET);

  if (decoded.provider !== provider) {
    throw new AppError("Invalid OAuth state", 400);
  }

  return decoded;
};

const buildFrontendUrl = (
  path,
  params = {},
  frontendOrigin = FRONTEND_APP_URL,
) => {
  const url = new URL(path, frontendOrigin);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
};

const redirectOAuthError = (res, message) => {
  res.redirect(buildFrontendUrl("/login", { oauthError: message }));
};

const redirectOAuthErrorTo = (res, message, frontendOrigin) => {
  res.redirect(
    buildFrontendUrl("/login", { oauthError: message }, frontendOrigin),
  );
};

const resolveFrontendOriginFromState = (state, provider) => {
  if (typeof state !== "string") {
    return null;
  }

  try {
    const decoded = verifyOAuthState(state, provider);
    return normalizeOrigin(decoded.frontendOrigin);
  } catch {
    return null;
  }
};

const randomBase64Url = (size = 32) => {
  return crypto.randomBytes(size).toString("base64url");
};

const sha256Base64Url = (value) => {
  return crypto.createHash("sha256").update(value).digest("base64url");
};

const createTwoFactorToken = (userId) => {
  return jwt.sign(
    {
      id: userId,
      purpose: "two-factor-login",
    },
    TWO_FACTOR_TOKEN_SECRET,
    { expiresIn: TWO_FACTOR_TOKEN_MAX_AGE },
  );
};

const createTwoFactorChallengeResponse = (res, userId) => {
  const twoFactorToken = createTwoFactorToken(userId);

  res.status(200).json({
    success: true,
    requiresTwoFactor: true,
    twoFactorToken,
    message: "Enter your 8-digit authenticator code to complete sign in",
  });
};

const findOrCreateOAuthUser = async ({
  provider,
  providerId,
  email,
  name,
  avatarUrl,
  xUsername,
}) => {
  const providerPath =
    provider === "google" ? "oauthProviders.googleId" : "oauthProviders.xId";

  let user = await User.findOne({ [providerPath]: providerId });

  if (!user && email) {
    user = await User.findOne({ email });
  }

  if (!user) {
    const randomPassword = randomBase64Url(24);
    const password = await bcrypt.hash(randomPassword, 10);

    user = await User.create({
      name: name || "OAuth User",
      email,
      password,
      isVerified: true,
      avatarUrl,
      oauthProviders: {
        ...(provider === "google" ? { googleId: providerId } : {}),
        ...(provider === "x" ? { xId: providerId, xUsername } : {}),
      },
    });

    return user;
  }

  if (provider === "google") {
    user.oauthProviders = {
      ...user.oauthProviders,
      googleId: providerId,
    };
  }

  if (provider === "x") {
    user.oauthProviders = {
      ...user.oauthProviders,
      xId: providerId,
      xUsername,
    };
  }

  if (!user.isVerified) {
    user.isVerified = true;
  }

  if (avatarUrl && !user.avatarUrl) {
    user.avatarUrl = avatarUrl;
  }

  if (name && !user.name) {
    user.name = name;
  }

  await user.save();
  return user;
};

const generateHashedOtp = async (email) => {
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

const getRecentOtp = async (email) => {
  return OTP.findOne({ email }).sort({ createdAt: -1 });
};

const createAuthenticatedSession = async (req, res, user) => {
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

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    await createLog({
      action: "REGISTER_FAILED",
      req,
      metadata: { email, reason: "User already exists" },
    });

    throw new AppError("User already exists", 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  const rawOtp = await generateHashedOtp(email);

  await sendEmail(
    email,
    "Verify your account",
    otpTemplate(rawOtp, "Email Verification"),
  );

  await createLog({
    user: user._id,
    action: "USER_REGISTERED",
    req,
    metadata: { email },
  });

  res.status(201).json({
    success: true,
    message: "User registered. OTP sent to email",
  });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const otpRecord = await OTP.findOne({ email });
  if (!otpRecord) {
    await createLog({
      action: "VERIFY_OTP_FAILED",
      req,
      metadata: { email, reason: "OTP record not found" },
    });

    throw new AppError("Invalid OTP", 400);
  }

  const isMatch = await bcrypt.compare(otp, otpRecord.otp);
  if (!isMatch || otpRecord.expiresAt < new Date()) {
    await createLog({
      action: "VERIFY_OTP_FAILED",
      req,
      metadata: { email, reason: "Invalid or expired OTP" },
    });

    throw new AppError("Invalid or expired OTP", 400);
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  user.isVerified = true;

  await OTP.deleteMany({ email });
  const { accessToken } = await createAuthenticatedSession(req, res, user);

  await createLog({
    user: user?._id,
    action: "ACCOUNT_VERIFIED",
    req,
    metadata: { email },
  });

  res.status(200).json({
    success: true,
    message: "Account verified successfully",
    accessToken,
    data: user,
  });
});

export const resendVerificationOtp = asyncHandler(async (req, res) => {
  const email = req.body.email || req.user?.email;

  if (!email) {
    throw new AppError("Email is required", 400);
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.isVerified) {
    res.status(200).json({
      success: true,
      message: "Account is already verified",
    });
    return;
  }

  const existingOtp = await getRecentOtp(user.email);
  if (existingOtp && existingOtp.createdAt.getTime() > Date.now() - 60 * 1000) {
    throw new AppError("Please wait before requesting another OTP", 429);
  }

  const rawOtp = await generateHashedOtp(user.email);

  await sendEmail(
    user.email,
    "Verify your account",
    otpTemplate(rawOtp, "Email Verification"),
  );

  await createLog({
    user: user._id,
    action: "VERIFICATION_OTP_RESENT",
    req,
    metadata: { email: user.email },
  });

  res.status(200).json({
    success: true,
    message: "Verification OTP sent to your email",
  });
});

export const verifyCurrentUserOtp = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  const email = req.user.email;
  const otpRecord = await OTP.findOne({ email });

  if (!otpRecord) {
    throw new AppError("Invalid OTP", 400);
  }

  const isMatch = await bcrypt.compare(otp, otpRecord.otp);
  if (!isMatch || otpRecord.expiresAt < new Date()) {
    throw new AppError("Invalid or expired OTP", 400);
  }

  const user = await User.findById(req.user.id).select("-password");
  if (!user) {
    throw new AppError("User not found", 404);
  }

  user.isVerified = true;
  await user.save();
  await OTP.deleteMany({ email });

  await createLog({
    user: user._id,
    action: "ACCOUNT_VERIFIED",
    req,
    metadata: { email },
  });

  res.status(200).json({
    success: true,
    message: "Account verified successfully",
    data: user,
  });
});

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

  if (user.twoFactorEnabled) {
    await createLog({
      user: user._id,
      action: "LOGIN_2FA_CHALLENGE_REQUIRED",
      req,
      metadata: { email, method: "otp" },
    });

    createTwoFactorChallengeResponse(res, user._id);
    return;
  }

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

  if (user.twoFactorEnabled) {
    await user.save();

    await createLog({
      user: user._id,
      action: "LOGIN_2FA_CHALLENGE_REQUIRED",
      req,
      metadata: { email, method: "password" },
    });

    createTwoFactorChallengeResponse(res, user._id);
    return;
  }

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

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    await createLog({
      action: "FORGOT_PASSWORD_FAILED",
      req,
      metadata: { email, reason: "User not found" },
    });

    throw new AppError("User not found", 404);
  }

  const otp = await generateHashedOtp(email);

  await sendEmail(email, "Reset Password", otpTemplate(otp, "Password Reset"));

  await createLog({
    user: user._id,
    action: "PASSWORD_RESET_OTP_SENT",
    req,
    metadata: { email },
  });

  res.json({ success: true, message: "OTP sent for password reset" });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const otpRecord = await OTP.findOne({ email });
  if (!otpRecord) {
    await createLog({
      action: "PASSWORD_RESET_FAILED",
      req,
      metadata: { email, reason: "OTP record not found" },
    });

    throw new AppError("Invalid or expired OTP", 400);
  }

  const isMatch = await bcrypt.compare(otp, otpRecord.otp);
  if (!isMatch || otpRecord.expiresAt < new Date()) {
    await createLog({
      action: "PASSWORD_RESET_FAILED",
      req,
      metadata: { email, reason: "Invalid or expired OTP" },
    });

    throw new AppError("Invalid or expired OTP", 400);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const user = await User.findOneAndUpdate(
    { email },
    { password: hashedPassword },
    { new: true },
  );

  await OTP.deleteMany({ email });

  await createLog({
    user: user?._id,
    action: "PASSWORD_RESET_SUCCESS",
    req,
    metadata: { email },
  });

  res.json({ success: true, message: "Password reset successful" });
});

export const logoutUser = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  const user = req.user;

  user.sessions = user.sessions.filter(
    (session) => session.refreshToken !== token,
  );
  await user.save();

  res.clearCookie("accessToken", AUTH_COOKIE_OPTIONS);
  res.clearCookie("refreshToken", AUTH_COOKIE_OPTIONS);

  await createLog({
    user: user._id,
    action: "LOGOUT_SUCCESS",
    req,
    metadata: { email: user.email },
  });

  res.json({ success: true, message: "Logged out successfully" });
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    await createLog({
      action: "REFRESH_TOKEN_MISSING",
      req,
    });

    throw new AppError("No refresh token", 401);
  }

  const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  const user = await User.findById(decoded.id);

  if (!user) {
    await createLog({
      action: "REFRESH_TOKEN_FAILED",
      req,
      metadata: { reason: "User not found", userId: decoded.id },
    });

    throw new AppError("User not found", 401);
  }

  if (decoded.tokenVersion !== user.tokenVersion) {
    await createLog({
      user: user._id,
      action: "REFRESH_TOKEN_REJECTED",
      req,
      metadata: { reason: "Token version mismatch" },
    });

    throw new AppError("Refresh token invalid", 401);
  }

  const session = user.sessions.find((currentSession) => {
    return currentSession.refreshToken === token;
  });

  if (!session) {
    await createLog({
      user: user._id,
      action: "REFRESH_TOKEN_REJECTED",
      req,
      metadata: { reason: "Invalid session" },
    });

    throw new AppError("Invalid session", 401);
  }

  const { accessToken, refreshToken } = generateTokens(user);

  user.sessions = user.sessions.filter(
    (currentSession) => currentSession.refreshToken !== token,
  );

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

  await createLog({
    user: user._id,
    action: "TOKEN_REFRESHED",
    req,
    metadata: { email: user.email },
  });

  res.json({ success: true, accessToken });
});

export const logoutAllDevices = asyncHandler(async (req, res) => {
  const user = req.user;

  user.sessions = [];
  user.tokenVersion += 1;
  await user.save();

  res.clearCookie("accessToken", AUTH_COOKIE_OPTIONS);
  res.clearCookie("refreshToken", AUTH_COOKIE_OPTIONS);

  await createLog({
    user: user._id,
    action: "LOGOUT_ALL_DEVICES",
    req,
    metadata: { email: user.email, tokenVersion: user.tokenVersion },
  });

  res.json({ success: true, message: "Logged out from all devices" });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select(
    "-password -twoFactorSecret -twoFactorTempSecret",
  );

  res.json({
    success: true,
    data: user,
  });
});

export const getSessions = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  const currentRefreshToken = req.cookies.refreshToken;

  res.json({
    success: true,
    sessions: user.sessions.map((session) => ({
      id: session._id,
      ip: session.ip,
      userAgent: session.userAgent,
      createdAt: session.createdAt,
      isCurrent: session.refreshToken === currentRefreshToken,
    })),
  });
});

export const logoutSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  const user = req.user;

  user.sessions = user.sessions.filter((session) => {
    return String(session._id) !== String(sessionId);
  });
  await user.save();

  await createLog({
    user: user._id,
    action: "LOGOUT_SINGLE_SESSION",
    req,
    metadata: { email: user.email },
  });

  res.json({ success: true, message: "Session removed" });
});

export const startGoogleOAuth = asyncHandler(async (req, res) => {
  if (
    !process.env.GOOGLE_OAUTH_CLIENT_ID ||
    !process.env.GOOGLE_OAUTH_REDIRECT_URI
  ) {
    throw new AppError("Google OAuth is not configured", 500);
  }

  const frontendOrigin = resolveFrontendOrigin(req);
  const state = createOAuthState("google", frontendOrigin);
  const authorizationUrl = new URL(GOOGLE_OAUTH_URL);

  authorizationUrl.searchParams.set(
    "client_id",
    process.env.GOOGLE_OAUTH_CLIENT_ID,
  );
  authorizationUrl.searchParams.set(
    "redirect_uri",
    process.env.GOOGLE_OAUTH_REDIRECT_URI,
  );
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", "openid email profile");
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("prompt", "select_account");

  res.redirect(authorizationUrl.toString());
});

export const handleGoogleOAuthCallback = asyncHandler(async (req, res) => {
  try {
    const { code, state, error } = req.query;
    const frontendFromState = resolveFrontendOriginFromState(state, "google");

    if (error) {
      redirectOAuthErrorTo(
        res,
        "Google sign-in cancelled",
        frontendFromState || FRONTEND_APP_URL,
      );
      return;
    }

    if (!code || !state) {
      throw new AppError("Missing OAuth code or state", 400);
    }

    const oauthState = verifyOAuthState(state, "google");
    const frontendOrigin =
      normalizeOrigin(oauthState.frontendOrigin) || FRONTEND_APP_URL;

    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
        client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      throw new AppError("Failed to exchange Google OAuth code", 401);
    }

    const tokenData = await tokenResponse.json();
    const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      throw new AppError("Failed to fetch Google profile", 401);
    }

    const profile = await userInfoResponse.json();

    if (!profile.sub || !profile.email) {
      throw new AppError(
        "Google account did not return required profile data",
        400,
      );
    }

    const user = await findOrCreateOAuthUser({
      provider: "google",
      providerId: profile.sub,
      email: profile.email.toLowerCase(),
      name: profile.name,
      avatarUrl: profile.picture,
    });

    if (user.twoFactorEnabled) {
      const twoFactorToken = createTwoFactorToken(user._id);
      res.redirect(
        buildFrontendUrl("/verify-2fa", { twoFactorToken }, frontendOrigin),
      );
      return;
    }

    await createAuthenticatedSession(req, res, user);

    await createLog({
      user: user._id,
      action: "LOGIN_SUCCESS_OAUTH",
      req,
      metadata: { provider: "google", email: user.email },
    });

    res.redirect(buildFrontendUrl("/dashboard", {}, frontendOrigin));
  } catch (error) {
    const frontendOrigin = resolveFrontendOriginFromState(
      req.query.state,
      "google",
    );
    redirectOAuthErrorTo(
      res,
      error.message || "Google sign-in failed",
      frontendOrigin || FRONTEND_APP_URL,
    );
  }
});

export const startXOAuth = asyncHandler(async (req, res) => {
  if (!process.env.X_OAUTH_CLIENT_ID || !process.env.X_OAUTH_REDIRECT_URI) {
    throw new AppError("X OAuth is not configured", 500);
  }

  const frontendOrigin = resolveFrontendOrigin(req);
  const state = createOAuthState("x", frontendOrigin);
  const codeVerifier = randomBase64Url(48);
  const codeChallenge = sha256Base64Url(codeVerifier);
  const authorizationUrl = new URL(X_OAUTH_URL);

  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("client_id", process.env.X_OAUTH_CLIENT_ID);
  authorizationUrl.searchParams.set(
    "redirect_uri",
    process.env.X_OAUTH_REDIRECT_URI,
  );
  authorizationUrl.searchParams.set(
    "scope",
    "tweet.read users.read offline.access",
  );
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("code_challenge", codeChallenge);
  authorizationUrl.searchParams.set("code_challenge_method", "S256");

  res.cookie(TWO_FACTOR_COOKIE_NAME, codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: OAUTH_PROVIDER_COOKIE_MAX_AGE,
  });

  res.redirect(authorizationUrl.toString());
});

export const handleXOAuthCallback = asyncHandler(async (req, res) => {
  try {
    const { code, state, error } = req.query;
    const frontendFromState = resolveFrontendOriginFromState(state, "x");

    if (error) {
      redirectOAuthErrorTo(
        res,
        "X sign-in cancelled",
        frontendFromState || FRONTEND_APP_URL,
      );
      return;
    }

    if (!code || !state) {
      throw new AppError("Missing OAuth code or state", 400);
    }

    const oauthState = verifyOAuthState(state, "x");
    const frontendOrigin =
      normalizeOrigin(oauthState.frontendOrigin) || FRONTEND_APP_URL;

    const codeVerifier = req.cookies[TWO_FACTOR_COOKIE_NAME];
    if (!codeVerifier) {
      throw new AppError("Missing OAuth verifier", 400);
    }

    const credentials = Buffer.from(
      `${process.env.X_OAUTH_CLIENT_ID}:${process.env.X_OAUTH_CLIENT_SECRET}`,
    ).toString("base64");

    const tokenResponse = await fetch(X_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        redirect_uri: process.env.X_OAUTH_REDIRECT_URI,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      throw new AppError("Failed to exchange X OAuth code", 401);
    }

    const tokenData = await tokenResponse.json();
    const userInfoResponse = await fetch(
      `${X_USERINFO_URL}?user.fields=profile_image_url,name,username`,
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      },
    );

    if (!userInfoResponse.ok) {
      throw new AppError("Failed to fetch X profile", 401);
    }

    const profilePayload = await userInfoResponse.json();
    const xProfile = profilePayload.data;

    if (!xProfile?.id) {
      throw new AppError("X account did not return required profile data", 400);
    }

    const oauthEmail = `x_${xProfile.id}@users.x.oauth.local`;
    const user = await findOrCreateOAuthUser({
      provider: "x",
      providerId: xProfile.id,
      email: oauthEmail,
      name: xProfile.name || xProfile.username || "X User",
      avatarUrl: xProfile.profile_image_url,
      xUsername: xProfile.username,
    });

    if (user.twoFactorEnabled) {
      const twoFactorToken = createTwoFactorToken(user._id);
      res.clearCookie(TWO_FACTOR_COOKIE_NAME);
      res.redirect(
        buildFrontendUrl("/verify-2fa", { twoFactorToken }, frontendOrigin),
      );
      return;
    }

    await createAuthenticatedSession(req, res, user);

    await createLog({
      user: user._id,
      action: "LOGIN_SUCCESS_OAUTH",
      req,
      metadata: { provider: "x", email: user.email },
    });

    res.clearCookie(TWO_FACTOR_COOKIE_NAME);
    res.redirect(buildFrontendUrl("/dashboard", {}, frontendOrigin));
  } catch (error) {
    res.clearCookie(TWO_FACTOR_COOKIE_NAME);
    const frontendOrigin = resolveFrontendOriginFromState(req.query.state, "x");
    redirectOAuthErrorTo(
      res,
      error.message || "X sign-in failed",
      frontendOrigin || FRONTEND_APP_URL,
    );
  }
});

export const setupTwoFactor = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("+twoFactorTempSecret");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const secret = generateSecret();
  const otpauthUrl = generateURI({
    ...TOTP_OPTIONS,
    issuer: TOTP_ISSUER,
    label: user.email,
    secret,
  });
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  user.twoFactorTempSecret = secret;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Scan the QR and verify with your 8-digit code",
    data: {
      otpauthUrl,
      qrCodeDataUrl,
      manualKey: secret,
    },
  });
});

export const enableTwoFactor = asyncHandler(async (req, res) => {
  const { code } = req.body;

  const user = await User.findById(req.user.id).select(
    "+twoFactorTempSecret +twoFactorSecret",
  );

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!user.twoFactorTempSecret) {
    throw new AppError("2FA setup has not been started", 400);
  }

  const isValid = verifyTotpCode(code, user.twoFactorTempSecret);

  if (!isValid) {
    throw new AppError("Invalid 2FA code", 400);
  }

  user.twoFactorSecret = user.twoFactorTempSecret;
  user.twoFactorTempSecret = undefined;
  user.twoFactorEnabled = true;
  await user.save();

  await createLog({
    user: user._id,
    action: "TWO_FACTOR_ENABLED",
    req,
    metadata: { email: user.email },
  });

  res.status(200).json({
    success: true,
    message: "Two-factor authentication enabled",
  });
});

export const disableTwoFactor = asyncHandler(async (req, res) => {
  const { code } = req.body;

  const user = await User.findById(req.user.id).select("+twoFactorSecret");
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    throw new AppError("Two-factor authentication is not enabled", 400);
  }

  const isValid = verifyTotpCode(code, user.twoFactorSecret);

  if (!isValid) {
    throw new AppError("Invalid 2FA code", 400);
  }

  user.twoFactorEnabled = false;
  user.twoFactorSecret = undefined;
  user.twoFactorTempSecret = undefined;
  await user.save();

  await createLog({
    user: user._id,
    action: "TWO_FACTOR_DISABLED",
    req,
    metadata: { email: user.email },
  });

  res.status(200).json({
    success: true,
    message: "Two-factor authentication disabled",
  });
});

export const verifyTwoFactorLogin = asyncHandler(async (req, res) => {
  const { twoFactorToken, code } = req.body;

  let decoded;
  try {
    decoded = jwt.verify(twoFactorToken, TWO_FACTOR_TOKEN_SECRET);
  } catch {
    throw new AppError("Invalid or expired 2FA token", 401);
  }

  if (decoded.purpose !== "two-factor-login") {
    throw new AppError("Invalid 2FA token", 401);
  }

  const user = await User.findById(decoded.id).select("+twoFactorSecret");
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    throw new AppError("Two-factor authentication is not enabled", 400);
  }

  const isValid = verifyTotpCode(code, user.twoFactorSecret);

  if (!isValid) {
    await createLog({
      user: user._id,
      action: "LOGIN_2FA_FAILED",
      req,
      metadata: { email: user.email },
    });

    throw new AppError("Invalid 2FA code", 400);
  }

  const { accessToken } = await createAuthenticatedSession(req, res, user);

  await createLog({
    user: user._id,
    action: "LOGIN_2FA_SUCCESS",
    req,
    metadata: { email: user.email },
  });

  res.status(200).json({
    success: true,
    message: "Two-factor verification successful",
    accessToken,
  });
});
