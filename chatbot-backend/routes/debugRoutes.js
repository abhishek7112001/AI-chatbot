// routes/debugRoute.js
const express = require("express");
const { getDebugData, getSessions, getSessionById } = require("../controllers/debugController");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/debug", authMiddleware, getDebugData); // Fetch debug data for a resource
router.get("/sessions", authMiddleware, getSessions); // List all sessions for a user
router.get("/session", authMiddleware, getSessionById); // Get a specific session

module.exports = router;