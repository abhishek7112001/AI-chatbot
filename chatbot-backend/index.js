const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const serverless = require("serverless-http");

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(cors());

app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/debugroutes", require("./routes/debugRoutes"));

app.get("/", (req, res) => res.send("Backend API Running"));

app.listen(5000, () =>
    console.log(`Server running on port 5000`)
);

// Export the app for Vercel (Serverless function)
module.exports = app;
module.exports.handler = serverless(app);
