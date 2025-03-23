const express = require("express");
const { registerUser, loginUser, logoutUser, checkSession, getUserProfile } = require("../controllers/userController");
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/session", checkSession);
router.get("/me", getUserProfile);

module.exports = router;
