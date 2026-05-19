import express from "express";
import {
  getSessions,
  logoutAllDevices,
  logoutSession,
  logoutUser,
  refreshAccessToken,
} from "../controllers/session.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { logoutSessionSchema } from "../schemas/auth.schema.js";

const sessionRouter = express.Router();

sessionRouter.post("/refresh", refreshAccessToken);
sessionRouter.post("/logout", protect, logoutUser);
sessionRouter.post("/logout-all", protect, logoutAllDevices);
sessionRouter.post(
  "/logout-session",
  protect,
  validate(logoutSessionSchema),
  logoutSession,
);
sessionRouter.get("/sessions", protect, getSessions);

export default sessionRouter;
