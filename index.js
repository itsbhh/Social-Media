// index.js
import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express(); // create app immediately

/* MIDDLEWARE */
app.use(helmet());
app.use(morgan("common"));
app.use(cors({
  origin: process.env.CLIENT_URL || true,
  credentials: true,
}));

// parsers
app.use(express.json()); // JSON bodies for login
app.use(express.urlencoded({ extended: true })); // urlencoded

// static assets
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

/* ROUTES */
// Ensure your routes do NOT import from index.js (avoid circular imports)
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/posts", postRoutes);

/* GLOBAL ERROR HANDLER */
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack || err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal Server Error" });
});

/* START SERVER & DB */
const PORT = process.env.PORT || 6001;
const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
  console.error("Missing MONGO_URL in environment");
  process.exit(1);
}

// connect without deprecated options — mongoose v8 handles options internally
mongoose
  .connect(MONGO_URL)
  .then(() => {
    app.listen(PORT, () => console.log(`Server Port: ${PORT}`));
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });
