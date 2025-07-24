import nodemailer from "nodemailer";
import { authenticator } from "otplib";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // Generate 6-digit OTP
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Email templates
  private getEmailTemplate(
    type: string,
    otp: string,
    email: string
  ): { subject: string; html: string } {
    const templates = {
      registration: {
        subject: "Verify Your Account - OTP Code",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome! Verify Your Account</h2>
            <p>Thank you for registering with us. Please use the following OTP to verify your account:</p>
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #007bff; font-size: 2em; margin: 0; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p><strong>This OTP will expire in 10 minutes.</strong></p>
            <p>If you didn't create an account with us, please ignore this email.</p>
            <hr>
            <small style="color: #666;">This is an automated message, please do not reply.</small>
          </div>
        `,
      },
      login: {
        subject: "Login Verification - OTP Code",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Login Verification</h2>
            <p>Someone is trying to log in to your account. Please use the following OTP to complete the login:</p>
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #28a745; font-size: 2em; margin: 0; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p><strong>This OTP will expire in 10 minutes.</strong></p>
            <p>If this wasn't you, please secure your account immediately.</p>
            <hr>
            <small style="color: #666;">This is an automated message, please do not reply.</small>
          </div>
        `,
      },
      "password-reset": {
        subject: "Password Reset - OTP Code",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>You have requested to reset your password. Please use the following OTP to proceed:</p>
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #dc3545; font-size: 2em; margin: 0; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p><strong>This OTP will expire in 10 minutes.</strong></p>
            <p>If you didn't request a password reset, please ignore this email.</p>
            <hr>
            <small style="color: #666;">This is an automated message, please do not reply.</small>
          </div>
        `,
      },
    };

    return templates[type as keyof typeof templates] || templates.registration;
  }

  // Send OTP email
  async sendOTP(
    email: string,
    otp: string,
    type: "registration" | "login" | "password-reset"
  ): Promise<boolean> {
    try {
      const { subject, html } = this.getEmailTemplate(type, otp, email);

      await this.transporter.sendMail({
        from: `"Your App" <${
          process.env.EMAIL_FROM || process.env.EMAIL_USER
        }>`,
        to: email,
        subject,
        html,
      });

      console.log(`OTP email sent successfully to ${email}`);
      return true;
    } catch (error) {
      console.error("Error sending OTP email:", error);
      return false;
    }
  }

  // Verify transporter connection
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log("Email service connected successfully");
      return true;
    } catch (error) {
      console.error("Email service connection failed:", error);
      return false;
    }
  }
}

export const emailService = new EmailService();
