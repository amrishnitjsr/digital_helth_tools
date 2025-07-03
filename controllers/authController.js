const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");

// Send OTP via 2Factor
exports.sendOTP = async (req, res) => {
  const { mobile } = req.body;

  if (!mobile || !/^\d{10}$/.test(mobile)) {
    return res.status(400).json({ success: false, message: "Valid 10-digit mobile number required" });
  }

  try {
    let user = await User.findOne({ mobile });

    if (!user) {
      user = new User({ mobile });
    }

    // Send OTP via 2Factor AUTOGEN API
    const otpRes = await axios.get(
      `https://2factor.in/API/V1/${process.env.TWO_FACTOR_API_KEY}/SMS/${mobile}/AUTOGEN`
    );

    if (otpRes.data.Status !== "Success") {
      return res.status(500).json({ success: false, message: "Failed to send OTP" });
    }

    // Save session ID and expiry in DB (OTP itself is not returned by AUTOGEN)
    user.otpSessionId = otpRes.data.Details;
    user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry
    await user.save();

    res.json({ success: true, message: "OTP sent successfully" });
  } catch (err) {
    console.error("❌ sendOTP error:", err.message);
    res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};

// Verify OTP via 2Factor
exports.verifyOTP = async (req, res) => {
  const { mobile, otp } = req.body;

  if (!mobile || !otp) {
    return res.status(400).json({ success: false, message: "Mobile and OTP are required" });
  }

  try {
    const user = await User.findOne({ mobile });

    if (!user || !user.otpSessionId) {
      return res.status(404).json({ success: false, message: "OTP session not found" });
    }

    if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
      return res.status(401).json({ success: false, message: "OTP expired" });
    }

    const verifyRes = await axios.get(
      `https://2factor.in/API/V1/${process.env.TWO_FACTOR_API_KEY}/SMS/VERIFY/${mobile}/${otp}`
    );

    if (verifyRes.data.Status !== "Success") {
      return res.status(401).json({ success: false, message: "Invalid OTP" });
    }

    // OTP verified, clear session info
    user.otpSessionId = null;
    user.otpExpiresAt = null;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({ success: true, message: "OTP verified successfully", token });
  } catch (err) {
    console.error("❌ verifyOTP error:", err.message);
    res.status(500).json({ success: false, message: "OTP verification failed" });
  }
};

// Register user
exports.register = async (req, res) => {
  const { email, mobile, password } = req.body;

  if (!email || !mobile || !password) {
    return res.status(400).json({ success: false, message: "Email, mobile and password are required" });
  }

  if (!/^\d{10}$/.test(mobile)) {
    return res.status(400).json({ success: false, message: "Valid 10-digit mobile number required" });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });

    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email or mobile already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ email, mobile, password: hashed });

    await user.save();

    res.status(201).json({ success: true, message: "Registration successful" });
  } catch (err) {
    console.error("❌ Registration error:", err.message);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
};

// Login user
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({ success: true, message: "Login successful", token });
  } catch (err) {
    console.error("❌ Login error:", err.message);
    res.status(500).json({ success: false, message: "Login failed" });
  }
};
