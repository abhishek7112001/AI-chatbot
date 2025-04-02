const Chat = require("../models/chat");

exports.saveChat = async (req, res) => {
  const { prompt, response, sessionId } = req.body;
  const userId = req.user.userId; // From authMiddleware (decoded JWT)

  try {
    if (!sessionId) {
      // New chat session
      const newSessionId = `session_${Date.now()}`;
      const chat = new Chat({
        userId,
        sessionId: newSessionId,
        messages: [{ prompt, response }],
      });
      await chat.save();
      res.status(201).json(chat);
    } else {
      // Append to existing chat session
      const chat = await Chat.findOne({ sessionId, userId });
      if (!chat) {
        return res.status(404).json({ error: "Chat session not found" });
      }
      chat.messages.push({ prompt, response });
      await chat.save();
      res.status(200).json(chat);
    }
  } catch (error) {
    console.error("Error saving chat:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getChats = async (req, res) => {
  const userId = req.user.userId; // From authMiddleware

  try {
    const chats = await Chat.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};