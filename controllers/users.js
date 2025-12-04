// controllers/users.js
import User from "../models/User.js";
import mongoose from "mongoose";

const isValidObjectId = (id) => typeof id === "string" && mongoose.Types.ObjectId.isValid(id);
const idEquals = (a, b) => {
  if (!a || !b) return false;
  return a.toString() === b.toString();
};

const formatUser = (u) => {
  if (!u) return null;
  const obj = u.toObject ? u.toObject() : u;
  return {
    _id: obj._id,
    firstName: obj.firstName,
    lastName: obj.lastName,
    occupation: obj.occupation,
    location: obj.location,
    picturePath: obj.picturePath || "",
  };
};

/* READ */
export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === "undefined" || !isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid or missing user id" });
    }

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
    if (!id || id === "undefined" || !isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid or missing user id" });
    }

    const user = await User.findById(id).exec();
    if (!user) return res.status(404).json({ message: "User not found" });

    const friendIds = Array.isArray(user.friends) ? user.friends : [];

    const friends = await Promise.all(
      friendIds.map((fid) => (isValidObjectId(fid) ? User.findById(fid).lean().exec() : null))
    );

    const formattedFriends = friends.filter(Boolean).map(formatUser);
    res.status(200).json(formattedFriends);
  } catch (err) {
    console.error("getUserFriends error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const query = req.params?.query || req.query?.q || "";
    if (!query) return res.status(400).json({ message: "Missing search query" });

    console.log("Search query:", query);

    const users = await User.find({
      $or: [
        { firstName: new RegExp(query, "i") },
        { lastName: new RegExp(query, "i") },
        { email: new RegExp(query, "i") },
      ],
    })
      .limit(50)
      .lean()
      .exec();

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    const formattedUsers = users.map(formatUser);
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
    if (
      !id ||
      !friendId ||
      id === "undefined" ||
      friendId === "undefined" ||
      !isValidObjectId(id) ||
      !isValidObjectId(friendId)
    ) {
      return res.status(400).json({ message: "Invalid or missing id or friendId" });
    }

    const user = await User.findById(id).exec();
    const friend = await User.findById(friendId).exec();

    if (!user || !friend) return res.status(404).json({ message: "User or friend not found" });

    if (!Array.isArray(user.friends)) user.friends = [];
    if (!Array.isArray(friend.friends)) friend.friends = [];

    const alreadyFriends = user.friends.some((fid) => idEquals(fid, friendId));

    if (alreadyFriends) {
      user.friends = user.friends.filter((fid) => !idEquals(fid, friendId));
      friend.friends = friend.friends.filter((fid) => !idEquals(fid, id));
    } else {
      if (!user.friends.some((fid) => idEquals(fid, friendId))) user.friends.push(friendId);
      if (!friend.friends.some((fid) => idEquals(fid, id))) friend.friends.push(id);
    }

    await user.save();
    await friend.save();

    const updatedFriendDocs = await Promise.all(
      user.friends.map((fid) => (isValidObjectId(fid) ? User.findById(fid).lean().exec() : null))
    );

    const formattedFriends = updatedFriendDocs.filter(Boolean).map(formatUser);
    return res.status(200).json(formattedFriends);
  } catch (err) {
    console.error("addRemoveFriend error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
