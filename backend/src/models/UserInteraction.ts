import mongoose, { Document, Schema } from "mongoose";

export interface IUserInteraction extends Document {
  _id: string;
  userId?: string; // Optional for anonymous usage
  sessionId?: string; // Anonymous session ID for tracking
  artifactId: string;
  chatSessionId: string;
  interactionType: "identification" | "chat" | "rating" | "voice_call";
  metadata?: {
    chatMessageCount?: number;
    timeSpent?: number; // in seconds
    quickQuestions?: string[];
    // Voice call specific metadata
    voiceSessionStarted?: Date;
    voiceSessionEnded?: Date;
    transcript?: string;
  };
  createdAt: Date;
}

const UserInteractionSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      default: null,
    },
    sessionId: {
      type: String,
      default: null, // For anonymous tracking
    },
    artifactId: {
      type: Schema.Types.ObjectId,
      ref: "Artifact",
      required: true,
    },
    chatSessionId: {
      type: Schema.Types.ObjectId,
      ref: "ChatSession",
      required: true,
    },
    interactionType: {
      type: String,
      enum: ["identification", "chat", "rating", "voice_call"],
      required: true,
    },
    metadata: {
      chatMessageCount: {
        type: Number,
        default: 0,
      },
      timeSpent: {
        type: Number,
        default: 0,
      },
      quickQuestions: [
        {
          type: String,
        },
      ],
      // Voice call specific metadata
      voiceSessionStarted: {
        type: Date,
      },
      voiceSessionEnded: {
        type: Date,
      },
      transcript: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
UserInteractionSchema.index({ userId: 1, createdAt: -1 });
UserInteractionSchema.index({ sessionId: 1, createdAt: -1 });
UserInteractionSchema.index({ artifactId: 1 });
UserInteractionSchema.index({ interactionType: 1 });

export default mongoose.model<IUserInteraction>(
  "UserInteraction",
  UserInteractionSchema
);
