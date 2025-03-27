// models/debugSessionModel.js
const mongoose = require("mongoose");

const debugSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sessionId: { type: String, required: true, unique: true }, // Unique session identifier
  resourceType: { type: String, required: true }, // e.g., "Lambda", "RDS"
  resourceId: { type: String, required: true }, // e.g., "XYZ"
  logs: [{ type: String }], // Array of log messages
  metrics: { type: Object }, // Key-value pairs for metrics
  genaiResponse: { type: String }, // GenAI analysis result
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("DebugSession", debugSessionSchema);