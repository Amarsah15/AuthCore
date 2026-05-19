import express from "express";
import { getUser } from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const userRouter = express.Router();

userRouter.get("/me", protect, getUser);

export default userRouter;
