import express from "express";
import {
  registerUser,
  verifyOtp,
  resendVerificationOtp,
  verifyCurrentUserOtp,
  loginWithOtp,
  verifyLoginOtp,
  forgotPassword,
  resetPassword,
  logoutUser,
  logoutAllDevices,
  logoutSession,
  loginWithPassword,
  refreshAccessToken,
  getSessions,
  getUser,
  startGoogleOAuth,
  handleGoogleOAuthCallback,
  startXOAuth,
  handleXOAuthCallback,
  setupTwoFactor,
  enableTwoFactor,
  disableTwoFactor,
  verifyTwoFactorLogin,
} from "../controllers/auth.controller.js";

import { protect, authorize } from "../middleware/auth.middleware.js";

import { authLimiter } from "../middleware/rateLimit.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  forgotPasswordSchema,
  loginOtpSchema,
  loginSchema,
  logoutSessionSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyCurrentUserOtpSchema,
  verifyOtpSchema,
  verifyTwoFactorSchema,
  twoFactorCodeSchema,
} from "../schemas/auth.schema.js";

const authRouter = express.Router();

// auth
authRouter.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  registerUser,
);
authRouter.post(
  "/verify-otp",
  authLimiter,
  validate(verifyOtpSchema),
  verifyOtp,
);
authRouter.post(
  "/resend-verification",
  authLimiter,
  validate(resendVerificationSchema),
  resendVerificationOtp,
);
authRouter.post(
  "/verify-current-user",
  protect,
  authLimiter,
  validate(verifyCurrentUserOtpSchema),
  verifyCurrentUserOtp,
);

// login
authRouter.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  loginWithPassword,
);
authRouter.post(
  "/login-otp",
  authLimiter,
  validate(loginOtpSchema),
  loginWithOtp,
);
authRouter.post(
  "/verify-login",
  authLimiter,
  validate(verifyOtpSchema),
  verifyLoginOtp,
);

// password
authRouter.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  forgotPassword,
);
authRouter.post(
  "/reset-password",
  authLimiter,
  validate(resetPasswordSchema),
  resetPassword,
);

// tokens
authRouter.post("/refresh", refreshAccessToken);

// oauth
authRouter.get("/oauth/google/start", startGoogleOAuth);
authRouter.get("/oauth/google/callback", handleGoogleOAuthCallback);
authRouter.get("/oauth/x/start", startXOAuth);
authRouter.get("/oauth/x/callback", handleXOAuthCallback);

// 2fa
authRouter.post("/2fa/setup", protect, setupTwoFactor);
authRouter.post(
  "/2fa/enable",
  protect,
  validate(twoFactorCodeSchema),
  enableTwoFactor,
);
authRouter.post(
  "/2fa/disable",
  protect,
  validate(twoFactorCodeSchema),
  disableTwoFactor,
);
authRouter.post(
  "/2fa/verify",
  validate(verifyTwoFactorSchema),
  verifyTwoFactorLogin,
);

// logout
authRouter.post("/logout", protect, logoutUser);
authRouter.post("/logout-all", protect, logoutAllDevices);
authRouter.post(
  "/logout-session",
  protect,
  validate(logoutSessionSchema),
  logoutSession,
);

// sessions
authRouter.get("/sessions", protect, getSessions);

// protected example
authRouter.get("/me", protect, getUser);

// admin route
authRouter.get("/admin", protect, authorize("admin"), (req, res) => {
  res.json({ message: "Admin access granted" });
});

export default authRouter;
