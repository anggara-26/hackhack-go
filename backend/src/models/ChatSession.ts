import mongoose, { Document, Schema } from "mongoose";

export interface IChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface IChatSession extends Document {
  _id: string;
  artifactId: string;
  userId?: string; // Optional for anonymous usage
  messages: IChatMessage[];
  title: string; // Generated title for the chat session
  rating?: "up" | "down"; // Thumbs up/down rating
  ratingComment?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema: Schema = new Schema({
  role: {
    type: String,
    enum: ["user", "assistant"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const ChatSessionSchema: Schema = new Schema(
  {
    artifactId: {
      type: Schema.Types.ObjectId,
      ref: "Artifact",
      required: true,
    },
    userId: {
      type: String,
      default: null, // Allow anonymous usage
    },
    messages: [ChatMessageSchema],
    title: {
      type: String,
      required: true,
      default: "Chat dengan Artefak",
    },
    rating: {
      type: String,
      enum: ["up", "down"],
      default: null,
    },
    ratingComment: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
ChatSessionSchema.index({ artifactId: 1, createdAt: -1 });
ChatSessionSchema.index({ userId: 1, createdAt: -1 });
ChatSessionSchema.index({ rating: 1 });

export default mongoose.model<IChatSession>("ChatSession", ChatSessionSchema);
