const express = require("express");
const { getLogs } = require("../controllers/logController");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/", authMiddleware, getLogs); // Fetch logs only for authenticated users

module.exports = router;
