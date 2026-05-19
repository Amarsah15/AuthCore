import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { openApiDocument, swaggerHtml } from "./docs/openapi.js";
import { generalLimiter } from "./middleware/rateLimit.middleware.js";

const app = express();
const FRONTEND_URL = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.replace(/\/$/, "")
  : undefined;
const allowedOrigins = [FRONTEND_URL, "http://localhost:5173"].filter(Boolean);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    next();
    return;
  }

  generalLimiter(req, res, next);
});

app.set("trust proxy", 1);

app.get("/api-docs.json", (req, res) => {
  res.json(openApiDocument);
});

app.get("/api-docs", (req, res) => {
  res.type("html").send(swaggerHtml);
});

export default app;
