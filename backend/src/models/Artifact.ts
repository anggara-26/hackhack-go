import mongoose, { Document, Schema } from "mongoose";

export interface IArtifact extends Document {
  _id: string;
  imageUrl: string;
  originalFilename: string;
  identificationResult: {
    name: string;
    category: string;
    description: string;
    history?: string;
    confidence: number;
    isRecognized: boolean;
  };
  userId?: string; // Optional for anonymous usage
  createdAt: Date;
  updatedAt: Date;
}

const ArtifactSchema: Schema = new Schema(
  {
    imageUrl: {
      type: String,
      required: true,
    },
    originalFilename: {
      type: String,
      required: true,
    },
    identificationResult: {
      name: {
        type: String,
        required: true,
      },
      category: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      history: {
        type: String,
        default: "",
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: 0,
      },
      isRecognized: {
        type: Boolean,
        default: false,
      },
    },
    userId: {
      type: String,
      default: null, // Allow anonymous usage
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
ArtifactSchema.index({ userId: 1, createdAt: -1 });
ArtifactSchema.index({ "identificationResult.category": 1 });

export default mongoose.model<IArtifact>("Artifact", ArtifactSchema);
