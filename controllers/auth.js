// controllers/auth.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const makeSafeUser = (u) => {
  if (!u) return null;
  const obj = u.toObject ? u.toObject() : u;
  return {
    _id: obj._id,
    id: obj._id,
    firstName: obj.firstName,
    lastName: obj.lastName,
    email: obj.email,
    picturePath: obj.picturePath || "",
    friends: Array.isArray(obj.friends) ? obj.friends : [],
    location: obj.location || "",
    occupation: obj.occupation || "",
  };
};

export const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      friends,
      location,
      occupation,
    } = req.body || {};

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const exists = await User.findOne({ email: email.toLowerCase() }).lean().exec();
    if (exists) return res.status(409).json({ error: "Email already registered" });

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const picturePath = req.file ? (req.file.filename || req.file.path) : (req.body.picturePath || "");

    const newUser = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: passwordHash,
      picturePath,
      friends: Array.isArray(friends) ? friends : [],
      location,
      occupation,
      viewedProfile: Math.floor(Math.random() * 10000),
      impressions: Math.floor(Math.random() * 10000),
    });

    const savedUser = await newUser.save();

    const safeUser = makeSafeUser(savedUser);
    res.status(201).json(safeUser);
  } catch (err) {
    console.error("Register error:", err);
    if (err.code === 11000) return res.status(409).json({ error: "Duplicate key" });
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const user = await User.findOne({ email: email.toLowerCase() }).exec();
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    const safeUser = makeSafeUser(user);
    res.status(200).json({ token, user: safeUser });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
};
