// routes/auth.js
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { register, login } from "../controllers/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// multer storage local to this router (avoids circular imports)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "..", "public", "assets")),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});
const upload = multer({ storage });

const router = express.Router();

// Register expects multipart/form-data (picture + other fields)
router.post("/register", upload.single("picture"), register);

// Login expects JSON body
router.post("/login", express.json(), login);

export default router;
