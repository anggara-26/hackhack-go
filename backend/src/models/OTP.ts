import { Schema, model, Document } from "mongoose";

export interface IOTP extends Document {
  email: string;
  otp: string;
  type: "registration" | "login" | "password-reset";
  expiresAt: Date;
  isUsed: boolean;
  attempts: number;
  createdAt: Date;
}

const otpSchema = new Schema<IOTP>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["registration", "login", "password-reset"],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    attempts: {
      type: Number,
      default: 0,
      max: 3,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-delete expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Ensure only one active OTP per email per type
otpSchema.index({ email: 1, type: 1, isUsed: 1 });

export const OTP = model<IOTP>("OTP", otpSchema);
