import { Request, Response } from "express";
import ChatSession from "../models/ChatSession";
import Artifact from "../models/Artifact";
import UserInteraction from "../models/UserInteraction";
import { openAIService } from "../services/openai";
import errorHOC from "@/utils/errorHandler";

/**
 * Send message to artifact (chat)
 */
export const sendMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { chatSessionId } = req.params;
    const { message, userId, sessionId } = req.body;

    if (!message || !message.trim()) {
      res.status(400).json({
        success: false,
        message: "Message content is required",
      });
      return;
    }

    // Find chat session
    const chatSession = await ChatSession.findById(chatSessionId);
    if (!chatSession) {
      res.status(404).json({
        success: false,
        message: "Chat session not found",
      });
      return;
    }

    // Get artifact info for context
    const artifact = await Artifact.findById(chatSession.artifactId);
    if (!artifact) {
      res.status(404).json({
        success: false,
        message: "Artifact not found",
      });
      return;
    }

    // Add user message to session
    chatSession.messages.push({
      role: "user",
      content: message.trim(),
      timestamp: new Date(),
    });

    // Get chat history for context (last 10 messages)
    const recentMessages = chatSession.messages.slice(-10).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Generate AI response
    const aiResponse = await openAIService.generateArtifactChat(
      artifact.identificationResult,
      recentMessages.slice(0, -1), // Exclude the current message
      message.trim()
    );

    // Add AI response to session
    chatSession.messages.push({
      role: "assistant",
      content: aiResponse,
      timestamp: new Date(),
    });

    // Update session timestamp
    chatSession.updatedAt = new Date();
    await chatSession.save();

    // Log interaction
    const interaction = new UserInteraction({
      userId: userId || null,
      sessionId: sessionId || null,
      artifactId: artifact._id,
      chatSessionId: chatSession._id,
      interactionType: "chat",
      metadata: {
        chatMessageCount: chatSession.messages.length,
      },
    });

    await interaction.save();

    res.json({
      success: true,
      data: {
        userMessage: {
          role: "user",
          content: message.trim(),
          timestamp:
            chatSession.messages[chatSession.messages.length - 2].timestamp,
        },
        aiResponse: {
          role: "assistant",
          content: aiResponse,
          timestamp:
            chatSession.messages[chatSession.messages.length - 1].timestamp,
        },
        totalMessages: chatSession.messages.length,
      },
    });
  } catch (error: any) {
    console.error("Error sending message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
};

/**
 * Get chat session with messages
 */
export const getChatSession = errorHOC(
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { chatSessionId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const chatSession = await ChatSession.findById(chatSessionId).lean();
      if (!chatSession) {
        res.status(404).json({
          success: false,
          message: "Chat session not found",
        });
        return;
      }

      // Get artifact info
      const artifact = await Artifact.findById(chatSession.artifactId).lean();

      // Paginate messages (get latest first, then reverse)
      const totalMessages = chatSession.messages.length;
      const skip = Math.max(0, totalMessages - page * limit);
      const paginatedMessages = chatSession.messages
        .slice(skip, skip + limit)
        .reverse(); // Show oldest first in the page

      res.json({
        success: true,
        data: {
          chatSession: {
            ...chatSession,
            messages: paginatedMessages,
          },
          artifact,
          pagination: {
            page,
            limit,
            total: totalMessages,
            pages: Math.ceil(totalMessages / limit),
            hasMore: skip > 0,
          },
        },
      });
    } catch (error: any) {
      console.error("Error getting chat session:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get chat session",
        error: error.message,
      });
    }
  }
);

/**
 * Send quick question
 */
export const sendQuickQuestion = errorHOC(
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { chatSessionId } = req.params;
      const { questionText, userId, sessionId } = req.body;

      if (!questionText) {
        res.status(400).json({
          success: false,
          message: "Question text is required",
        });
        return;
      }

      // Use the same logic as sendMessage but mark it as a quick question
      req.body.message = questionText;

      // Call sendMessage function
      await sendMessage(req, res);

      // If successful, log the quick question
      if (res.statusCode === 200) {
        const interaction = await UserInteraction.findOne({
          chatSessionId,
          interactionType: "chat",
        }).sort({ createdAt: -1 });

        if (interaction) {
          if (!interaction.metadata) interaction.metadata = {};
          if (!interaction.metadata.quickQuestions)
            interaction.metadata.quickQuestions = [];
          interaction.metadata.quickQuestions.push(questionText);
          await interaction.save();
        }
      }
    } catch (error: any) {
      console.error("Error sending quick question:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send quick question",
        error: error.message,
      });
    }
  }
);

/**
 * Rate chat session
 */
export const rateChatSession = errorHOC(
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { chatSessionId } = req.params;
      const { rating, comment, userId, sessionId } = req.body;

      if (!rating || (rating !== "up" && rating !== "down")) {
        res.status(400).json({
          success: false,
          message: "Rating must be either 'up' or 'down'",
        });
        return;
      }

      const chatSession = await ChatSession.findById(chatSessionId);
      if (!chatSession) {
        res.status(404).json({
          success: false,
          message: "Chat session not found",
        });
        return;
      }

      // Update rating
      chatSession.rating = rating;
      chatSession.ratingComment = comment || "";
      await chatSession.save();

      // Log interaction
      const interaction = new UserInteraction({
        userId: userId || null,
        sessionId: sessionId || null,
        artifactId: chatSession.artifactId,
        chatSessionId: chatSession._id,
        interactionType: "rating",
      });

      await interaction.save();

      res.json({
        success: true,
        data: {
          rating: chatSession.rating,
          comment: chatSession.ratingComment,
        },
      });
    } catch (error: any) {
      console.error("Error rating chat session:", error);
      res.status(500).json({
        success: false,
        message: "Failed to rate chat session",
        error: error.message,
      });
    }
  }
);

/**
 * Get user's chat history
 */
export const getChatHistory = errorHOC(
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, sessionId } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      let query: any = {};

      if (userId) {
        query.userId = userId;
      } else if (sessionId) {
        query.userId = null; // Anonymous sessions
      }

      const chatSessions = await ChatSession.find(query)
        .populate(
          "artifactId",
          "identificationResult.name identificationResult.category imageUrl"
        )
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // Add message count and last message to each session
      const sessionsWithDetails = chatSessions.map((session) => ({
        ...session,
        messageCount: session.messages.length,
        lastMessage: session.messages[session.messages.length - 1] || null,
        hasRating: !!session.rating,
      }));

      const total = await ChatSession.countDocuments(query);

      res.json({
        success: true,
        data: {
          chatSessions: sessionsWithDetails,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error: any) {
      console.error("Error getting chat history:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get chat history",
        error: error.message,
      });
    }
  }
);

/**
 * Delete chat session
 */
export const deleteChatSession = errorHOC(
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { chatSessionId } = req.params;

      const chatSession = await ChatSession.findById(chatSessionId);
      if (!chatSession) {
        res.status(404).json({
          success: false,
          message: "Chat session not found",
        });
        return;
      }

      // Delete associated interactions
      await UserInteraction.deleteMany({ chatSessionId });

      // Delete chat session
      await ChatSession.findByIdAndDelete(chatSessionId);

      res.json({
        success: true,
        message: "Chat session deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting chat session:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete chat session",
        error: error.message,
      });
    }
  }
);
