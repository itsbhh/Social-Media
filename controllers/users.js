// controllers/users.js
import User from "../models/User.js";
import mongoose from "mongoose";

// helper to ensure id comparison works for ObjectId or string
const idEquals = (a, b) => {
  if (!a || !b) return false;
  return a.toString() === b.toString();
};

/* READ */
export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Missing user id" });

    const user = await User.findById(id).lean().exec();
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (err) {
    console.error("getUser error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getUserFriends = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Missing user id" });

    const user = await User.findById(id).exec();
    if (!user) return res.status(404).json({ message: "User not found" });

    const friendIds = Array.isArray(user.friends) ? user.friends : [];

    const friends = await Promise.all(
      friendIds.map((fid) => User.findById(fid).lean().exec())
    );

    const formattedFriends = friends
      .filter(Boolean)
      .map(({ _id, firstName, lastName, occupation, location, picturePath }) => ({
        _id,
        firstName,
        lastName,
        occupation,
        location,
        picturePath,
      }));

    res.status(200).json(formattedFriends);
  } catch (err) {
    console.error("getUserFriends error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const searchUsers = async (req, res) => {
  try {
    // Accept either req.params.query or req.query.q for flexibility
    const query = req.params?.query || req.query?.q || "";
    if (!query) return res.status(400).json({ message: "Missing search query" });

    console.log("Search query:", query);

    const users = await User.find({
      $or: [
        { firstName: new RegExp(query, "i") },
        { lastName: new RegExp(query, "i") },
        { email: new RegExp(query, "i") }, // optional helpful field
      ],
    })
      .limit(50) // avoid huge results
      .lean()
      .exec();

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    const formattedUsers = users.map(
      ({ _id, firstName, lastName, occupation, location, picturePath }) => ({
        _id,
        firstName,
        lastName,
        occupation,
        location,
        picturePath,
      })
    );

    res.status(200).json(formattedUsers);
  } catch (err) {
    console.error("searchUsers error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/* UPDATE */
export const addRemoveFriend = async (req, res) => {
  try {
    const { id, friendId } = req.params;
    if (!id || !friendId) return res.status(400).json({ message: "Missing id or friendId" });

    // load both users
    const user = await User.findById(id).exec();
    const friend = await User.findById(friendId).exec();

    if (!user || !friend) return res.status(404).json({ message: "User or friend not found" });

    // ensure friends arrays exist
    if (!Array.isArray(user.friends)) user.friends = [];
    if (!Array.isArray(friend.friends)) friend.friends = [];

    const alreadyFriends = user.friends.some((fid) => idEquals(fid, friendId));

    if (alreadyFriends) {
      // remove friendship both sides
      user.friends = user.friends.filter((fid) => !idEquals(fid, friendId));
      friend.friends = friend.friends.filter((fid) => !idEquals(fid, id));
    } else {
      // add friendship both sides (avoid dupes)
      if (!user.friends.some((fid) => idEquals(fid, friendId))) user.friends.push(friendId);
      if (!friend.friends.some((fid) => idEquals(fid, id))) friend.friends.push(id);
    }

    await user.save();
    await friend.save();

    // return updated friend list for the user
    const updatedFriendDocs = await Promise.all(user.friends.map((fid) => User.findById(fid).lean().exec()));

    const formattedFriends = updatedFriendDocs
      .filter(Boolean)
      .map(({ _id, firstName, lastName, occupation, location, picturePath }) => ({
        _id,
        firstName,
        lastName,
        occupation,
        location,
        picturePath,
      }));

    return res.status(200).json(formattedFriends);
  } catch (err) {
    console.error("addRemoveFriend error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
