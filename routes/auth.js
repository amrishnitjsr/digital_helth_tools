const express = require("express");
const router = express.Router();

// Import controller functions
const { register, login } = require("../controllers/authController");

// Register route
router.post("/register", register);

// Login route
router.post("/login", login);

module.exports = router;
