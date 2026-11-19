
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/authRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";
import paperRoutes from "./routes/paperRoutes.js";

import { notFound } from "./middleware/notFound.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";

import { authenticate } from "./middleware/auth.middleware.js";
import ragRoutes from "./routes/ragRoutes.js";
import compareRoutes from "./routes/compareRoutes.js";
import researchGapRoutes from "./routes/researchGapRoutes.js";

const app = express();

// Global middleware
app.use(helmet());

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header, such as server-to-server requests.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(morgan("dev"));

// API routes
app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use(
  "/api/v1/workspaces",
  authenticate,
  workspaceRoutes
);
app.use(
  "/api/v1/workspaces/:workspaceId/papers",
  authenticate,
  paperRoutes
);
app.use(
  "/api/v1/workspaces/:workspaceId/ask",
  authenticate,
  ragRoutes
);
app.use(
  "/api/v1/workspaces/:workspaceId/compare",
  authenticate,
  compareRoutes
);
app.use(
  "/api/v1/workspaces/:workspaceId/research-gaps",
  authenticate,
  researchGapRoutes
);


// 404 middleware
app.use(notFound);

// Error handler
app.use(errorHandler);

export default app;

