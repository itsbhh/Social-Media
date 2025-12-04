// index.js
import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const FRONTEND_ORIGIN = "https://lovegram.netlify.app";

/* SECURITY & LOGGING */
app.use(helmet());
app.use(morgan("common"));

/* CORS: allow only the frontend origin and credentials (if used) */
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);

/* PARSERS */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* STATIC ASSETS: serve images + set headers so cross-origin pages can embed them */
const assetsPath = path.join(__dirname, "public", "assets");
app.use(
  "/assets",
  express.static(assetsPath, {
    setHeaders: (res) => {
      res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
      // allow embedding for pages using COEP
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      if (process.env.ALLOW_CREDENTIALS === "true") {
        res.setHeader("Access-Control-Allow-Credentials", "true");
      }
    },
  })
);

/* API ROUTES - mounted before any client fallback */
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/posts", postRoutes);

/* debug: list registered routes (temporary - remove in production) */
app.get("/_routes", (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      const { path: p, methods } = middleware.route;
      routes.push({ path: p, methods: Object.keys(methods) });
    } else if (middleware.name === "router" && middleware.handle.stack) {
      middleware.handle.stack.forEach((handler) => {
        const route = handler.route;
        if (route) routes.push({ path: route.path, methods: Object.keys(route.methods) });
      });
    }
  });
  res.json(routes);
});

/* Optionally serve client build if present (ensure this is AFTER API routes) */
const buildPath = path.join(__dirname, "client", "build");
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
  });
}

/* root health */
app.get("/", (req, res) => res.status(200).send("API running"));

/* GLOBAL ERROR HANDLER */
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack || err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal Server Error" });
});

/* START */
const PORT = process.env.PORT || 6001;
const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
  console.error("Missing MONGO_URL in environment");
  process.exit(1);
}

mongoose
  .connect(MONGO_URL)
  .then(() => {
    app.listen(PORT, () => console.log(`Server Port: ${PORT}`));
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });
