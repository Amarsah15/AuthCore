import express from "express";
import { authorize, protect } from "../middleware/auth.middleware.js";

const adminRouter = express.Router();

adminRouter.get("/admin", protect, authorize("admin"), (req, res) => {
  res.json({ message: "Admin access granted" });
});

export default adminRouter;
