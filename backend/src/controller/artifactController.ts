import { Request, Response } from "express";
import Artifact from "../models/Artifact";
import ChatSession from "../models/ChatSession";
import UserInteraction from "../models/UserInteraction";
import { openAIService } from "../services/openai";
import {
  processAndSaveImage,
  getImageUrl,
  getImagePath,
} from "../utils/imageUpload";
import path from "path";
import fs from "fs";
import errorHOC from "@/utils/errorHandler";
import { JWTUtils } from "@/utils/jwt";

/**
 * Upload and identify artifact
 */
export const uploadAndIdentifyArtifact = errorHOC(
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: "No image file provided",
        });
        return;
      }

      // Process and save image
      const { fileName } = await processAndSaveImage(
        req.file.buffer,
        req.file.originalname
      );

      // Get identification from OpenAI
      const identificationResult = await openAIService.identifyArtifact(
        req.file.buffer,
        req.file.originalname
      );

      // Create artifact record
      const artifact = new Artifact({
        imageUrl: getImageUrl(fileName),
        originalFilename: req.file.originalname,
        identificationResult,
        userId: req.body.userId || null,
      });

      await artifact.save();

      // Create initial chat session
      const chatSession = new ChatSession({
        artifactId: artifact._id,
        userId: req.body.userId || null,
        title: `Chat dengan ${identificationResult.name}`,
        messages: [
          {
            role: "assistant",
            content: `Halo! Aku ${identificationResult.name}! ${identificationResult.description} 😊\n\nAda yang pengen kamu tanyain tentang aku?`,
            timestamp: new Date(),
          },
        ],
      });

      await chatSession.save();

      // Log interaction
      const interaction = new UserInteraction({
        userId: req.body.userId || null,
        sessionId: req.body.sessionId || null,
        artifactId: artifact._id,
        chatSessionId: chatSession._id,
        interactionType: "identification",
      });

      await interaction.save();

      // Generate quick questions
      const quickQuestions =
        openAIService.generateQuickQuestions(identificationResult);

      res.status(201).json({
        success: true,
        data: {
          artifact,
          chatSession,
          quickQuestions,
        },
      });
    } catch (error: any) {
      console.error("Error uploading artifact:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process artifact",
        error: error.message,
      });
      return;
    }
  }
);

/**
 * Get user's artifact history
 */
export const getArtifactHistory = errorHOC(
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.query;
      // get bearer token from headers
      const authHeader = req.headers.authorization;
      const token = authHeader ? authHeader.split(" ")[1] : null;

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      let query: any = {};

      if (token) {
        // If authenticated, use userId from token
        const decodedToken = JWTUtils.verifyToken(token);
        console.log("Decoded token:", decodedToken);
        query.userId = decodedToken.userId;
      } else if (sessionId) {
        // For anonymous users, we'd need to implement session tracking
        query.userId = null;
      }

      const artifacts = await Artifact.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      console.log("Artifacts found:", artifacts.length);

      // Get chat sessions for each artifact
      const artifactsWithChats = await Promise.all(
        artifacts.map(async (artifact) => {
          const chatSessions = await ChatSession.find({
            artifactId: artifact._id,
          })
            .sort({ updatedAt: -1 })
            .limit(3) // Get latest 3 chat sessions
            .lean();

          return {
            ...artifact,
            recentChats: chatSessions,
            totalChats: await ChatSession.countDocuments({
              artifactId: artifact._id,
            }),
          };
        })
      );

      const total = await Artifact.countDocuments(query);

      res.json({
        success: true,
        data: {
          artifacts: artifactsWithChats,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error: any) {
      console.error("Error getting artifact history:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get artifact history",
        error: error.message,
      });
    }
  }
);

/**
 * Get single artifact with chat history
 */
export const getArtifactById = errorHOC(
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const artifact = await Artifact.findById(id).lean();
      if (!artifact) {
        res.status(404).json({
          success: false,
          message: "Artifact not found",
        });
        return;
      }

      // Get chat sessions
      const chatSessions = await ChatSession.find({ artifactId: id })
        .sort({ updatedAt: -1 })
        .lean();

      // Generate quick questions
      const quickQuestions = openAIService.generateQuickQuestions(
        artifact.identificationResult
      );

      res.json({
        success: true,
        data: {
          artifact,
          chatSessions,
          quickQuestions,
        },
      });
    } catch (error: any) {
      console.error("Error getting artifact:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get artifact",
        error: error.message,
      });
    }
  }
);

/**
 * Serve artifact images
 */
export const serveImage = errorHOC(
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { filename } = req.params;
      const imagePath = getImagePath(filename);

      if (!fs.existsSync(imagePath)) {
        res.status(404).json({
          success: false,
          message: "Image not found",
        });
        return;
      }

      res.sendFile(imagePath);
    } catch (error: any) {
      console.error("Error serving image:", error);
      res.status(500).json({
        success: false,
        message: "Failed to serve image",
        error: error.message,
      });
    }
  }
);

/**
 * Delete artifact and associated data
 */
export const deleteArtifact = errorHOC(
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const artifact = await Artifact.findById(id);
      if (!artifact) {
        res.status(404).json({
          success: false,
          message: "Artifact not found",
        });
        return;
      }

      // Delete associated chat sessions
      await ChatSession.deleteMany({ artifactId: id });

      // Delete associated interactions
      await UserInteraction.deleteMany({ artifactId: id });

      // Delete image file
      const fileName = path.basename(artifact.imageUrl);
      const imagePath = getImagePath(fileName);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }

      // Delete artifact
      await Artifact.findByIdAndDelete(id);

      res.json({
        success: true,
        message: "Artifact deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting artifact:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete artifact",
        error: error.message,
      });
    }
  }
);

/**
 * Get popular artifacts (most visited)
 */
export const getPopularArtifacts = errorHOC(
  async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      // Get artifacts with chat session counts as popularity metric
      const artifacts = await Artifact.aggregate([
        {
          $lookup: {
            from: "chatsessions",
            localField: "_id",
            foreignField: "artifactId",
            as: "chatSessions",
          },
        },
        {
          $lookup: {
            from: "userinteractions",
            localField: "_id",
            foreignField: "artifactId",
            as: "interactions",
          },
        },
        {
          $addFields: {
            popularity: {
              $add: [
                { $size: "$chatSessions" },
                { $multiply: [{ $size: "$interactions" }, 0.5] },
              ],
            },
          },
        },
        {
          $sort: { popularity: -1, createdAt: -1 },
        },
        {
          $limit: limit,
        },
        {
          $project: {
            chatSessions: 0,
            interactions: 0,
            popularity: 0,
          },
        },
      ]);

      res.json({
        success: true,
        data: artifacts,
      });
    } catch (error: any) {
      console.error("Error getting popular artifacts:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get popular artifacts",
        error: error.message,
      });
    }
  }
);

/**
 * Get recent artifacts
 */
export const getRecentArtifacts = errorHOC(
  async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      const artifacts = await Artifact.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      res.json({
        success: true,
        data: artifacts,
      });
    } catch (error: any) {
      console.error("Error getting recent artifacts:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get recent artifacts",
        error: error.message,
      });
    }
  }
);

/**
 * Search artifacts by name, category, or description
 */
export const searchArtifacts = errorHOC(
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { q } = req.query;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!q || typeof q !== "string") {
        res.status(400).json({
          success: false,
          message: "Search query is required",
        });
        return;
      }

      const searchRegex = new RegExp(q, "i");

      const artifacts = await Artifact.find({
        $or: [
          { "identificationResult.name": searchRegex },
          { "identificationResult.category": searchRegex },
          { "identificationResult.description": searchRegex },
          { "identificationResult.culturalSignificance": searchRegex },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      res.json({
        success: true,
        data: artifacts,
        meta: {
          query: q,
          count: artifacts.length,
        },
      });
    } catch (error: any) {
      console.error("Error searching artifacts:", error);
      res.status(500).json({
        success: false,
        message: "Failed to search artifacts",
        error: error.message,
      });
    }
  }
);
