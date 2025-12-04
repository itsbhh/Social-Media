// controllers/auth.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const register = async (req, res) => {
  try {
    // When using multer.single('picture') -> file is in req.file
    // Other fields come in req.body
    const {
      firstName,
      lastName,
      email,
      password,
      friends,
      location,
      occupation,
    } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // prevent duplicate email
    const exists = await User.findOne({ email: email.toLowerCase() }).lean().exec();
    if (exists) return res.status(409).json({ error: "Email already registered" });

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // prefer file-based picture path if multer provided one
    const picturePath = req.file ? req.file.filename || req.file.path : req.body.picturePath || "";

    const newUser = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: passwordHash,
      picturePath,
      friends: friends || [],
      location,
      occupation,
      viewedProfile: Math.floor(Math.random() * 10000),
      impressions: Math.floor(Math.random() * 10000),
    });

    const savedUser = await newUser.save();
    // avoid returning password hash
    const safeUser = (({ _id, firstName: f, lastName: l, email: e, picturePath: p, friends: fr, location: loc, occupation: occ, viewedProfile, impressions }) => ({
      id: _id,
      firstName: f,
      lastName: l,
      email: e,
      picturePath: p,
      friends: fr,
      location: loc,
      occupation: occ,
      viewedProfile,
      impressions
    }))(savedUser.toObject());

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

    const safeUser = (({ _id, firstName, lastName, email: e, picturePath, friends, location, occupation }) => ({
      id: _id,
      firstName,
      lastName,
      email: e,
      picturePath,
      friends,
      location,
      occupation
    }))(user.toObject());

    res.status(200).json({ token, user: safeUser });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
};
