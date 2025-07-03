const User = require("../models/User");
const twilio = require("twilio");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

exports.sendOTP = async (mobile) => {
  if (!mobile || !/^\d{10}$/.test(mobile)) {
    throw new Error("Valid 10-digit mobile number required");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  let user = await User.findOne({ mobile });
  if (!user) user = new User({ mobile });

  user.otp = otp;
  user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await user.save();

  await client.messages.create({
    body: `Your OTP code is ${otp}`,
    from: fromNumber,
    to: `+91${mobile}`,
  });

  return { success: true, message: "OTP sent successfully" };
};

exports.verifyOTP = async (mobile, otp) => {
  const user = await User.findOne({ mobile });

  if (!user || user.otp !== otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
    throw new Error("Invalid or expired OTP");
  }

  user.otp = null;
  user.otpExpiresAt = null;
  await user.save();

  return { success: true, message: "OTP verified" };
};
