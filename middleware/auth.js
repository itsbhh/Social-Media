// middleware/auth.js
import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    // Accept Authorization header in either case
    let token = req.header("Authorization") || req.header("authorization");

    if (!token) {
      return res.status(403).json({ error: "Access denied, no token provided" });
    }

    if (typeof token === "string" && token.startsWith("Bearer ")) {
      token = token.slice(7).trim();
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: verified.id };
    return next();
  } catch (err) {
    console.error("verifyToken error:", err);
    // invalid or expired token => 401
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
