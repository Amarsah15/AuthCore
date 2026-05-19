import express from "express";
import {
  forgotPassword,
  resetPassword,
} from "../controllers/password.controller.js";
import { authLimiter } from "../middleware/rateLimit.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../schemas/auth.schema.js";

const passwordRouter = express.Router();

passwordRouter.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  forgotPassword,
);
passwordRouter.post(
  "/reset-password",
  authLimiter,
  validate(resetPasswordSchema),
  resetPassword,
);

export default passwordRouter;
