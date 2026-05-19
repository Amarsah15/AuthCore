import express from "express";
import {
  loginWithOtp,
  loginWithPassword,
  verifyLoginOtp,
} from "../controllers/login.controller.js";
import { authLimiter } from "../middleware/rateLimit.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  loginOtpSchema,
  loginSchema,
  verifyOtpSchema,
} from "../schemas/auth.schema.js";

const loginRouter = express.Router();

loginRouter.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  loginWithPassword,
);
loginRouter.post(
  "/login-otp",
  authLimiter,
  validate(loginOtpSchema),
  loginWithOtp,
);
loginRouter.post(
  "/verify-login",
  authLimiter,
  validate(verifyOtpSchema),
  verifyLoginOtp,
);

export default loginRouter;
