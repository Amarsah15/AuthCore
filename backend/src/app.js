import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import csrf from "csurf";
import helmet from "helmet";
import { generalLimiter } from "./middleware/rateLimit.middleware.js";
import { openApiDocument, swaggerHtml } from "./docs/openapi.js";

const app = express();
const isProduction = process.env.NODE_ENV === "production";
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  },
});
const normalizeOrigin = (value) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  try {
    return new URL(value.trim()).origin;
  } catch {
    return null;
  }
};

const allowedOrigins = Array.from(
  new Set(
    [
      "http://localhost:5173",
      process.env.FRONTEND_URL,
      process.env.CORS_ORIGINS,
    ]
      .filter(Boolean)
      .flatMap((value) => value.split(","))
      .map((origin) => normalizeOrigin(origin))
      .filter(Boolean),
  ),
);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    const corsError = new Error("Not allowed by CORS");
    corsError.status = 403;
    callback(corsError);
  },
  methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-CSRF-Token",
    "x-csrf-token",
  ],
  credentials: true,
};

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(csrfProtection);
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    next();
    return;
  }

  generalLimiter(req, res, next);
});
app.set("trust proxy", 1);

app.get("/api/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.get("/api-docs.json", (req, res) => {
  res.json(openApiDocument);
});

app.get("/api-docs", (req, res) => {
  res.type("html").send(swaggerHtml);
});

export default app;
