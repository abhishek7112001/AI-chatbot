const axios = require("axios");
require("dotenv").config();

const API_GATEWAY_URL = process.env.API_GATEWAY_URL; // Use API Gateway Link from .env

// Fetch Logs from API Gateway
exports.getLogs = async (req, res) => {
  try {
    const response = await axios.get(API_GATEWAY_URL);
    res.json({ logs: response.data });
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
};
