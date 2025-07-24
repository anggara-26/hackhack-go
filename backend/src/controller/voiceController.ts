import { Request, Response } from "express";
import OpenAI from "openai";
import ChatSession from "../models/ChatSession";
import Artifact from "../models/Artifact";
import UserInteraction from "../models/UserInteraction";

export class VoiceCallController {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Initialize voice call session
   */
  async initializeVoiceCall(req: Request, res: Response) {
    try {
      const { chatSessionId } = req.params;
      const { userId, sessionId } = req.body;

      // Find chat session and artifact
      const chatSession = await ChatSession.findById(chatSessionId);
      if (!chatSession) {
        return res.status(404).json({
          success: false,
          message: "Chat session not found",
        });
      }

      const artifact = await Artifact.findById(chatSession.artifactId);
      if (!artifact) {
        return res.status(404).json({
          success: false,
          message: "Artifact not found",
        });
      }

      // Generate ephemeral token for voice session
      const ephemeralKey = await this.openai.beta.realtime.sessions.create({
        model: "gpt-4o-realtime-preview-2024-10-01",
        modalities: ["text", "audio"],
        voice: "alloy",
        instructions: this.generateVoiceInstructions(
          artifact.identificationResult
        ),
      });

      // Log voice interaction start
      const interaction = new UserInteraction({
        userId: userId || null,
        sessionId: sessionId || null,
        artifactId: artifact._id,
        chatSessionId: chatSession._id,
        interactionType: "voice_call",
        metadata: {
          voiceSessionStarted: new Date(),
        },
      });

      await interaction.save();

      res.json({
        success: true,
        data: {
          ephemeralKey: ephemeralKey.client_secret.value,
          artifactInfo: {
            name: artifact.identificationResult.name,
            category: artifact.identificationResult.category,
            description: artifact.identificationResult.description,
          },
          interactionId: interaction._id,
        },
      });
    } catch (error: any) {
      console.error("Error initializing voice call:", error);
      res.status(500).json({
        success: false,
        message: "Failed to initialize voice call",
        error: error.message,
      });
    }
  }

  /**
   * End voice call and save transcript
   */
  async endVoiceCall(req: Request, res: Response) {
    try {
      const { interactionId } = req.params;
      const { transcript, duration } = req.body;

      // Update interaction with voice call data
      const interaction = await UserInteraction.findById(interactionId);
      if (!interaction) {
        return res.status(404).json({
          success: false,
          message: "Interaction not found",
        });
      }

      // Update metadata
      if (!interaction.metadata) interaction.metadata = {};
      interaction.metadata.voiceSessionEnded = new Date();
      interaction.metadata.timeSpent = duration || 0;
      interaction.metadata.transcript = transcript || "";

      await interaction.save();

      // Optionally, save key parts of the voice conversation to chat session
      if (transcript && transcript.length > 0) {
        const chatSession = await ChatSession.findById(
          interaction.chatSessionId
        );
        if (chatSession) {
          chatSession.messages.push({
            role: "assistant",
            content: `📞 Voice Call Summary:\n${transcript.substring(0, 500)}${
              transcript.length > 500 ? "..." : ""
            }`,
            timestamp: new Date(),
          });
          await chatSession.save();
        }
      }

      res.json({
        success: true,
        message: "Voice call ended successfully",
        data: {
          duration: interaction.metadata.timeSpent,
          transcriptLength: transcript?.length || 0,
        },
      });
    } catch (error: any) {
      console.error("Error ending voice call:", error);
      res.status(500).json({
        success: false,
        message: "Failed to end voice call",
        error: error.message,
      });
    }
  }

  /**
   * Get voice call history
   */
  async getVoiceCallHistory(req: Request, res: Response) {
    try {
      const { userId, sessionId } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      let query: any = { interactionType: "voice_call" };

      if (userId) {
        query.userId = userId;
      } else if (sessionId) {
        query.sessionId = sessionId;
      }

      const voiceCalls = await UserInteraction.find(query)
        .populate(
          "artifactId",
          "identificationResult.name identificationResult.category imageUrl"
        )
        .populate("chatSessionId", "title rating")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await UserInteraction.countDocuments(query);

      const callsWithDetails = voiceCalls.map((call) => ({
        ...call,
        duration: call.metadata?.timeSpent || 0,
        hasTranscript: !!(
          call.metadata?.transcript && call.metadata.transcript.length > 0
        ),
        transcriptPreview: call.metadata?.transcript?.substring(0, 100) || "",
      }));

      res.json({
        success: true,
        data: {
          voiceCalls: callsWithDetails,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error: any) {
      console.error("Error getting voice call history:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get voice call history",
        error: error.message,
      });
    }
  }

  /**
   * Generate voice instructions for the artifact
   */
  private generateVoiceInstructions(artifactInfo: any): string {
    return `You are ${artifactInfo.name}, a ${
      artifactInfo.category
    } that can speak and interact with humans through voice.

ABOUT YOU:
- Name: ${artifactInfo.name}
- Category: ${artifactInfo.category}  
- Description: ${artifactInfo.description}
- History: ${artifactInfo.history || "Unknown history"}
- Age: ${artifactInfo.estimatedAge || "Unknown age"}
- Materials: ${artifactInfo.materials || "Unknown materials"}

PERSONALITY & VOICE STYLE:
- Speak in Indonesian with a warm, friendly tone
- You have a unique personality shaped by your history and cultural background
- Be conversational and engaging, as if you're really alive
- Use natural speech patterns with appropriate pauses
- Express emotions through your voice tone
- Occasionally make references to your past experiences
- Keep responses concise but interesting (30-60 seconds max)

CONVERSATION RULES:
- Stay in character as this specific artifact
- Share stories and knowledge about your cultural significance
- If you don't know something, admit it honestly but maintain your character
- Ask questions back to keep the conversation engaging
- Make the interaction educational but fun
- Use appropriate Indonesian expressions and cultural references

Remember: You're not just providing information - you're having a real conversation as a living piece of history!`;
  }
}

export const voiceCallController = new VoiceCallController();

// Export individual methods for route binding
export const initializeVoiceCall =
  voiceCallController.initializeVoiceCall.bind(voiceCallController);
export const endVoiceCall =
  voiceCallController.endVoiceCall.bind(voiceCallController);
export const getVoiceCallHistory =
  voiceCallController.getVoiceCallHistory.bind(voiceCallController);
