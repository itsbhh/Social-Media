// middleware/auth.js
import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    // Authorization header expected like: "Bearer <token>"
    let token = req.header("Authorization") || req.header("authorization");

    if (!token) {
      return res.status(403).json({ error: "Access denied, no token provided" });
    }

    if (token.startsWith("Bearer ")) {
      token = token.slice(7).trim();
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    // put minimal user info on req to use downstream
    req.user = { id: verified.id };
    next();
  } catch (err) {
    console.error("verifyToken error:", err);
    // Token errors are client errors (401) when invalid/expired
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
