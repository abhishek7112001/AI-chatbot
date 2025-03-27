const Chat = require("../models/chat");

exports.saveChat = async (req, res) => {
  const { prompt, response } = req.body;
  const userId = req.user.userId; // From authMiddleware (decoded JWT)
  const sessionId = `session_${Date.now()}`; // Unique session ID

  try {
    const chat = new Chat({
      userId,
      sessionId,
      messages: [{ prompt, response }],
    });
    await chat.save();
    res.status(201).json({ sessionId, message: "Chat saved" });
  } catch (error) {
    console.error("Error saving chat:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getChats = async (req, res) => {
  const userId = req.user.userId; // From authMiddleware

  try {
    const chats = await Chat.find({ userId });
    res.status(200).json(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};