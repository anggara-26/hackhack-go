import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import { JWTUtils, AuthenticatedRequest } from "@/utils/jwt";
import errorHOC from "@/utils/errorHandler";

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

class AuthController {
  /**
   * Register a new user
   * @route POST /api/auth/register
   */
  register = errorHOC(
    async (req: Request<{}, {}, RegisterRequest>, res: Response) => {
      const { name, email, password } = req.body;

      // Validation
      if (!name || !email || !password) {
        res.status(400).json({
          success: false,
          message: "Please provide name, email, and password",
        });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long",
        });
        return;
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        res.status(400).json({
          success: false,
          message: "User with this email already exists",
        });
        return;
      }

      // Create new user
      const user = new User({
        name: name.trim(),
        email: email.toLowerCase(),
        password,
      });

      await user.save();

      // Generate JWT token
      const token = JWTUtils.generateToken({
        userId: (user._id as string).toString(),
        email: user.email,
        role: user.role,
      });

      const refreshToken = JWTUtils.generateRefreshToken({
        userId: (user._id as string).toString(),
        email: user.email,
        role: user.role,
      });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user: user.toAuthJSON(),
          token,
          refreshToken,
        },
      });
    }
  );

  /**
   * Login user
   * @route POST /api/auth/login
   */
  login = errorHOC(
    async (req: Request<{}, {}, LoginRequest>, res: Response) => {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: "Please provide email and password",
        });
        return;
      }

      // Find user and include password for comparison
      const user = await User.findOne({ email: email.toLowerCase() }).select(
        "+password"
      );
      if (!user) {
        res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
        return;
      }

      // Check if user is active
      if (!user.isActive) {
        res.status(401).json({
          success: false,
          message: "Account is deactivated. Please contact support.",
        });
        return;
      }

      // Compare password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
        return;
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT token
      const token = JWTUtils.generateToken({
        userId: (user._id as string).toString(),
        email: user.email,
        role: user.role,
      });

      const refreshToken = JWTUtils.generateRefreshToken({
        userId: (user._id as string).toString(),
        email: user.email,
        role: user.role,
      });

      res.json({
        success: true,
        message: "Login successful",
        data: {
          user: user.toAuthJSON(),
          token,
          refreshToken,
        },
      });
    }
  );

  /**
   * Get current user profile
   * @route GET /api/auth/me
   */
  getProfile = errorHOC(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user: user.toAuthJSON(),
      },
    });
  });

  /**
   * Update user profile
   * @route PUT /api/auth/profile
   */
  updateProfile = errorHOC(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const { name } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    if (name) user.name = name.trim();

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: user.toAuthJSON(),
      },
    });
  });

  /**
   * Change password
   * @route PUT /api/auth/change-password
   */
  changePassword = errorHOC(
    async (req: AuthenticatedRequest, res: Response) => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: "Please provide current password and new password",
        });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({
          success: false,
          message: "New password must be at least 6 characters long",
        });
        return;
      }

      const user = await User.findById(req.user.userId).select("+password");
      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(
        currentPassword
      );
      if (!isCurrentPasswordValid) {
        res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
        return;
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: "Password changed successfully",
      });
    }
  );

  /**
   * Logout user (client-side token removal)
   * @route POST /api/auth/logout
   */
  logout = errorHOC(async (req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      message:
        "Logout successful. Please remove the token from client storage.",
    });
  });
}

export default new AuthController();
