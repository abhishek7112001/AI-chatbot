const express = require("express");
const router = express.Router();
const { saveChat, getChats } = require("../controllers/chatController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/chats", authMiddleware, saveChat);
router.get("/chats", authMiddleware, getChats);

module.exports = router;