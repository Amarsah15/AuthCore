import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { createLog } from "../utils/logger.utils.js";
import { AppError } from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createAuthenticatedSession } from "./auth.shared.js";

const OAUTH_STATE_MAX_AGE = 10 * 60 * 1000;

const FRONTEND_APP_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const GOOGLE_OAUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

const OAUTH_STATE_SECRET =
  process.env.OAUTH_STATE_SECRET || process.env.ACCESS_TOKEN_SECRET;

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

const findOrCreateGoogleUser = async ({ providerId, email, name, avatarUrl }) => {
  let user = await User.findOne({ "oauthProviders.googleId": providerId });

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
        googleId: providerId,
      },
    });

    return user;
  }

  user.oauthProviders = {
    ...user.oauthProviders,
    googleId: providerId,
  };

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

    const user = await findOrCreateGoogleUser({
      providerId: profile.sub,
      email: profile.email.toLowerCase(),
      name: profile.name,
      avatarUrl: profile.picture,
    });

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
