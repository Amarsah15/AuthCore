import express from "express";
import {
  handleGoogleOAuthCallback,
  startGoogleOAuth,
} from "../controllers/oauth.controller.js";

const oauthRouter = express.Router();

oauthRouter.get("/oauth/google/start", startGoogleOAuth);
oauthRouter.get("/oauth/google/callback", handleGoogleOAuthCallback);

export default oauthRouter;
