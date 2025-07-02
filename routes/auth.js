const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");

// POST /register route
router.post("/register", register);

// POST /login route
router.post("/login", login);

module.exports = router;
