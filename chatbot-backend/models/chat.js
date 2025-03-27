const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Link to User model
  sessionId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  messages: [
    {
      prompt: { type: String, required: true },
      response: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model("Chat", chatSchema);