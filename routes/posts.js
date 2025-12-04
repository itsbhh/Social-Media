// routes/posts.js
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import {
  createPost,
  getFeedPosts,
  getUserPosts,
  likePost,
  addComment,
} from "../controllers/posts.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// local multer storage for post images
const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, "..", "public", "assets")),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, "-")
      .toLowerCase();
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});
const upload = multer({ storage });

/* CREATE */
router.post("/", verifyToken, upload.single("picture"), createPost);

/* READ */
router.get("/", verifyToken, getFeedPosts); // GET /posts
router.get("/:userId/posts", verifyToken, getUserPosts);

/* UPDATE */
router.patch("/:id/like", verifyToken, likePost);
router.patch("/:id/comment", verifyToken, addComment);

export default router;
