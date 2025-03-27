const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = (req, res, next) => {
  const authHeader = req.header("Authorization");

  console.log("Auth Header Received:", authHeader); // Debug log

  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  // Ensure token includes "Bearer " prefix and extract it
  const token = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : authHeader;

  console.log("Extracted Token:", token); // Debug log

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token:", decoded); // Debug log
    req.user = decoded; // Attach decoded user info (includes userId)
    next();
  } catch (error) {
    console.error("Token verification error:", error.message); // Debug log
    res.status(401).json({ message: "Invalid token" });
  }
};