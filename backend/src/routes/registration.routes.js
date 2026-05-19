import express from "express";
import {
  registerUser,
  resendVerificationOtp,
  verifyCurrentUserOtp,
  verifyOtp,
} from "../controllers/registration.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { authLimiter } from "../middleware/rateLimit.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  registerSchema,
  resendVerificationSchema,
  verifyCurrentUserOtpSchema,
  verifyOtpSchema,
} from "../schemas/auth.schema.js";

const registrationRouter = express.Router();

registrationRouter.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  registerUser,
);
registrationRouter.post(
  "/verify-otp",
  authLimiter,
  validate(verifyOtpSchema),
  verifyOtp,
);
registrationRouter.post(
  "/resend-verification",
  authLimiter,
  validate(resendVerificationSchema),
  resendVerificationOtp,
);
registrationRouter.post(
  "/verify-current-user",
  protect,
  authLimiter,
  validate(verifyCurrentUserOtpSchema),
  verifyCurrentUserOtp,
);

export default registrationRouter;
