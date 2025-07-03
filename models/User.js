const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: true },
  mobile: { type: String, unique: true, required: true },
  password: { type: String },
  otp: { type: String },                    // ✅ Store OTP value
  otpSessionId: { type: String },           // ✅ Store 2Factor session ID
  otpExpiresAt: { type: Date },             // ✅ OTP expiry time
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
