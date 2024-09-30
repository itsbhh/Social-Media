import express from "express";
import {
  getUser,
  getUserFriends,
  addRemoveFriend,
  searchUsers, // Import searchUsers controller
} from "../controllers/users.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* READ */
router.get("/:id", verifyToken, getUser);
router.get("/:id/friends", verifyToken, getUserFriends);
router.get("/search/:query", verifyToken, searchUsers); // New route for search functionality

/* UPDATE */
router.patch("/:id/:friendId", verifyToken, addRemoveFriend);

export default router;
