const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const activeTokens = new Set(); // Store active tokens in memory for logout

// Register User
exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashedPassword });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Login User
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    activeTokens.add(token); // Store active token

    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Logout User
exports.logoutUser = async (req, res) => {
  const token = req.header("Authorization");
  
  if (!token) return res.status(400).json({ message: "No token provided" });

  activeTokens.delete(token); // Remove token from active list
  res.json({ message: "Logged out successfully" });
};

// Check Active Session
exports.checkSession = async (req, res) => {
  const token = req.header("Authorization");
  
  if (token && activeTokens.has(token)) {
    res.json({ message: "Session active" });
  } else {
    res.status(401).json({ message: "Session expired" });
  }
};

// Get Logged-in User Details
exports.getUserProfile = async (req, res) => {
  try {
    // Extract the token from the Authorization header
    const token = req.header("Authorization").replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("name");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ name: user.name });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
