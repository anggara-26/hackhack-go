import jwt from "jsonwebtoken";
import { Request } from "express";

export interface JwtPayload {
  userId: string;
  email: string;
  role?: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export class JWTUtils {
  private static readonly JWT_SECRET = process.env.JWT_SECRET;
  private static readonly JWT_EXPIRES_IN = "7d";

  /**
   * Generate a JWT token
   */
  static generateToken(payload: Omit<JwtPayload, "iat" | "exp">): string {
    if (!this.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }

    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });
  }

  /**
   * Verify and decode a JWT token
   */
  static verifyToken(token: string): JwtPayload {
    if (!this.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }

    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as JwtPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error("Invalid token");
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error("Token expired");
      }
      throw new Error("Token verification failed");
    }
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader) return null;

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return null;
    }

    return parts[1];
  }

  /**
   * Generate a refresh token (longer expiry)
   */
  static generateRefreshToken(
    payload: Omit<JwtPayload, "iat" | "exp">
  ): string {
    if (!this.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }

    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: "30d",
    });
  }
}

// Convenience functions for easier import
export const generateToken = (userId: string) => {
  const payload = { userId, email: "", role: "user" };
  return {
    accessToken: JWTUtils.generateToken(payload),
    refreshToken: JWTUtils.generateRefreshToken(payload),
  };
};

export const verifyToken = (token: string) => JWTUtils.verifyToken(token);
