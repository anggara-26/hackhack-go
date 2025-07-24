import { Request, Response } from "express";
import { OTP } from "@/models/OTP";
import User from "@/models/User";
import { emailService } from "@/utils/email";
import { JWTUtils } from "@/utils/jwt";

// Request OTP for registration
export const requestOTPForRegistration = async (
  req: Request,
  res: Response
) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ error: "User already exists with this email" });
      return;
    }

    // Delete any existing OTPs for this email and type
    await OTP.deleteMany({ email, type: "registration" });

    // Generate new OTP
    const otpCode = emailService.generateOTP();

    // Save OTP to database
    const otp = new OTP({
      email,
      otp: otpCode,
      type: "registration",
    });
    await otp.save();

    // Send OTP email
    const emailSent = await emailService.sendOTP(
      email,
      otpCode,
      "registration"
    );

    if (!emailSent) {
      await OTP.deleteOne({ _id: otp._id });
      return res.status(500).json({ error: "Failed to send OTP email" });
    }

    return res.status(200).json({
      message: "OTP sent successfully to your email",
      expiresAt: otp.expiresAt,
    });
  } catch (error) {
    console.error("Request OTP error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Verify OTP and complete registration
export const verifyOTPAndRegister = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, otp, name, password } = req.body;

    if (!email || !otp || !name || !password) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }

    // Find and validate OTP
    const otpRecord = await OTP.findOne({
      email,
      otp,
      type: "registration",
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      res.status(400).json({ error: "Invalid or expired OTP" });
      return;
    }

    // Check attempts
    if (otpRecord.attempts >= 3) {
      res.status(400).json({ error: "Maximum OTP attempts exceeded" });
      return;
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // Create user
    const user = new User({
      name,
      email,
      password,
      isEmailVerified: true,
    });
    await user.save();

    // Generate tokens
    const accessToken = JWTUtils.generateToken({
      userId: user._id as string,
      email: user.email,
      role: user.role,
    });
    const refreshToken = JWTUtils.generateRefreshToken({
      userId: user._id as string,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      message: "Registration successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Verify OTP and register error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Request OTP for login
export const requestOTPForLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Delete any existing OTPs for this email and type
    await OTP.deleteMany({ email, type: "login" });

    // Generate new OTP
    const otpCode = emailService.generateOTP();

    // Save OTP to database
    const otp = new OTP({
      email,
      otp: otpCode,
      type: "login",
    });
    await otp.save();

    // Send OTP email
    const emailSent = await emailService.sendOTP(email, otpCode, "login");

    if (!emailSent) {
      await OTP.deleteOne({ _id: otp._id });
      res.status(500).json({ error: "Failed to send OTP email" });
      return;
    }

    res.status(200).json({
      message: "OTP sent successfully to your email",
      expiresAt: otp.expiresAt,
    });
  } catch (error) {
    console.error("Request OTP for login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Verify OTP and complete login
export const verifyOTPAndLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({ error: "Email and OTP are required" });
      return;
    }

    // Find and validate OTP
    const otpRecord = await OTP.findOne({
      email,
      otp,
      type: "login",
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      // Increment attempts for wrong OTP
      await OTP.updateOne(
        { email, type: "login", isUsed: false },
        { $inc: { attempts: 1 } }
      );
      res.status(400).json({ error: "Invalid or expired OTP" });
      return;
    }

    // Check attempts
    if (otpRecord.attempts >= 3) {
      res.status(400).json({ error: "Maximum OTP attempts exceeded" });
      return;
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // Generate tokens
    const accessToken = JWTUtils.generateToken({
      userId: user._id as string,
      email: user.email,
      role: user.role,
    });
    const refreshToken = JWTUtils.generateRefreshToken({
      userId: user._id as string,
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Verify OTP and login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Request OTP for password reset
export const requestOTPForPasswordReset = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Delete any existing OTPs for this email and type
    await OTP.deleteMany({ email, type: "password-reset" });

    // Generate new OTP
    const otpCode = emailService.generateOTP();

    // Save OTP to database
    const otp = new OTP({
      email,
      otp: otpCode,
      type: "password-reset",
    });
    await otp.save();

    // Send OTP email
    const emailSent = await emailService.sendOTP(
      email,
      otpCode,
      "password-reset"
    );

    if (!emailSent) {
      await OTP.deleteOne({ _id: otp._id });
      res.status(500).json({ error: "Failed to send OTP email" });
      return;
    }

    res.status(200).json({
      message: "Password reset OTP sent successfully to your email",
      expiresAt: otp.expiresAt,
    });
  } catch (error) {
    console.error("Request OTP for password reset error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Verify OTP and reset password
export const verifyOTPAndResetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      res
        .status(400)
        .json({ error: "Email, OTP, and new password are required" });
      return;
    }

    // Find and validate OTP
    const otpRecord = await OTP.findOne({
      email,
      otp,
      type: "password-reset",
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      // Increment attempts for wrong OTP
      await OTP.updateOne(
        { email, type: "password-reset", isUsed: false },
        { $inc: { attempts: 1 } }
      );
      res.status(400).json({ error: "Invalid or expired OTP" });
      return;
    }

    // Check attempts
    if (otpRecord.attempts >= 3) {
      res.status(400).json({ error: "Maximum OTP attempts exceeded" });
      return;
    }

    // Find user and update password
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    res.status(200).json({
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Verify OTP and reset password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
