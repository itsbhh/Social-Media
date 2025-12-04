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

const app = express();

const FRONTEND_ORIGIN = process.env.CLIENT_URL || "https://lovegram.netlify.app";

app.use(helmet());
app.use(morgan("common"));
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const assetsPath = path.join(__dirname, "public", "assets");
app.use(
  "/assets",
  express.static(assetsPath, {
    setHeaders: (res) => {
      res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
      if (process.env.ALLOW_CREDENTIALS === "true") {
        res.setHeader("Access-Control-Allow-Credentials", "true");
      }
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);

app.get("/", (req, res) => res.status(200).send("API running"));
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/posts", postRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack || err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal Server Error" });
});

const PORT = process.env.PORT || 6001;
const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
  console.error("Missing MONGO_URL");
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
