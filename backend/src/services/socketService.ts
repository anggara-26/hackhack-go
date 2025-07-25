import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import ChatSession from "../models/ChatSession";
import Artifact from "../models/Artifact";
import UserInteraction from "../models/UserInteraction";
import { openAIService } from "./openai";
import { ResponseInput } from "openai/resources/responses/responses";

export interface ChatSocketData {
  userId?: string;
  sessionId?: string;
  chatSessionId?: string;
}

export class SocketService {
  private io: SocketIOServer;

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*", // Configure this based on your frontend domain
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
    });

    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on("connection", (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      // Join chat room
      socket.on(
        "join_chat",
        async (data: {
          chatSessionId: string;
          userId?: string;
          sessionId?: string;
        }) => {
          try {
            const { chatSessionId, userId, sessionId } = data;

            // Validate chat session exists
            const chatSession = await ChatSession.findById(chatSessionId);
            if (!chatSession) {
              socket.emit("error", { message: "Chat session not found" });
              return;
            }

            // Join room for this chat session
            socket.join(chatSessionId);

            // Store user data in socket
            socket.data = {
              userId,
              sessionId,
              chatSessionId,
            } as ChatSocketData;

            // Send current chat history
            const artifact = await Artifact.findById(chatSession.artifactId);

            socket.emit("joined_chat", {
              chatSession,
              artifact: artifact
                ? {
                    name: artifact.identificationResult.name,
                    category: artifact.identificationResult.category,
                    description: artifact.identificationResult.description,
                    imageUrl: artifact.imageUrl,
                  }
                : null,
              quickQuestions: artifact
                ? openAIService.generateQuickQuestions(
                    artifact.identificationResult
                  )
                : [],
            });

            console.log(`👤 User joined chat ${chatSessionId}`);
          } catch (error) {
            console.error("Error joining chat:", error);
            socket.emit("error", { message: "Failed to join chat" });
          }
        }
      );

      // Handle regular chat messages
      socket.on("send_message", async (data: { message: string }) => {
        await this.handleChatMessage(socket, data.message, false);
      });

      // Handle quick questions
      socket.on("send_quick_question", async (data: { question: string }) => {
        await this.handleChatMessage(socket, data.question, true);
      });

      // Handle typing indicators
      socket.on("typing_start", () => {
        const { chatSessionId } = socket.data as ChatSocketData;
        if (chatSessionId) {
          socket
            .to(chatSessionId)
            .emit("user_typing", { userId: socket.data.userId || socket.id });
        }
      });

      socket.on("typing_stop", () => {
        const { chatSessionId } = socket.data as ChatSocketData;
        if (chatSessionId) {
          socket.to(chatSessionId).emit("user_stopped_typing", {
            userId: socket.data.userId || socket.id,
          });
        }
      });

      // Handle rating
      socket.on(
        "rate_chat",
        async (data: { rating: "up" | "down"; comment?: string }) => {
          try {
            const { chatSessionId, userId, sessionId } =
              socket.data as ChatSocketData;

            if (!chatSessionId) {
              socket.emit("error", {
                message: "Not connected to a chat session",
              });
              return;
            }

            const chatSession = await ChatSession.findById(chatSessionId);
            if (!chatSession) {
              socket.emit("error", { message: "Chat session not found" });
              return;
            }

            // Update rating
            chatSession.rating = data.rating;
            chatSession.ratingComment = data.comment || "";
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

            socket.emit("rating_saved", {
              rating: chatSession.rating,
              comment: chatSession.ratingComment,
            });

            console.log(`⭐ Chat ${chatSessionId} rated: ${data.rating}`);
          } catch (error) {
            console.error("Error saving rating:", error);
            socket.emit("error", { message: "Failed to save rating" });
          }
        }
      );

      // Handle disconnect
      socket.on("disconnect", () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
      });
    });
  }

  private async handleChatMessage(
    socket: any,
    message: string,
    isQuickQuestion: boolean = false
  ) {
    try {
      const { chatSessionId, userId, sessionId } =
        socket.data as ChatSocketData;

      if (!chatSessionId) {
        socket.emit("error", { message: "Not connected to a chat session" });
        return;
      }

      if (!message || !message.trim()) {
        socket.emit("error", { message: "Message cannot be empty" });
        return;
      }

      // Find chat session and artifact
      const chatSession = await ChatSession.findById(chatSessionId);
      if (!chatSession) {
        socket.emit("error", { message: "Chat session not found" });
        return;
      }

      const artifact = await Artifact.findById(chatSession.artifactId);
      if (!artifact) {
        socket.emit("error", { message: "Artifact not found" });
        return;
      }

      // Add user message to session
      const userMessage = {
        role: "user" as const,
        content: message.trim(),
        timestamp: new Date(),
      };

      chatSession.messages.push(userMessage);

      // Emit user message to other clients in the room (not the sender)
      socket.broadcast.to(chatSessionId).emit("message_received", {
        message: userMessage,
        isQuickQuestion,
      });

      // Show typing indicator for AI to all clients
      this.io.to(chatSessionId).emit("ai_typing", {
        artifactName: artifact.identificationResult.name,
      });

      // Get chat history for context
      const recentMessages = chatSession.messages.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Generate AI response with streaming
      await this.streamAIResponse(
        chatSessionId,
        artifact.identificationResult,
        recentMessages.slice(0, -1), // Exclude current message
        message.trim(),
        chatSession
      );

      // Log interaction
      const interaction = new UserInteraction({
        userId: userId || null,
        sessionId: sessionId || null,
        artifactId: artifact._id,
        chatSessionId: chatSession._id,
        interactionType: "chat",
        metadata: {
          chatMessageCount: chatSession.messages.length,
          quickQuestions: isQuickQuestion ? [message.trim()] : undefined,
        },
      });

      await interaction.save();
    } catch (error) {
      console.error("Error handling chat message:", error);
      socket.emit("error", { message: "Failed to process message" });

      // Stop typing indicator on error
      const { chatSessionId } = socket.data as ChatSocketData;
      if (chatSessionId) {
        this.io.to(chatSessionId).emit("ai_stopped_typing");
      }
    }
  }

  private async streamAIResponse(
    chatSessionId: string,
    artifactInfo: any,
    chatHistory: string | ResponseInput,
    userMessage: string,
    chatSession: any
  ) {
    try {
      const systemPrompt = `Kamu adalah ${artifactInfo.name}, sebuah ${
        artifactInfo.category
      } yang bisa bicara dengan manusia. 

INFORMASI TENTANG DIRIMU:
- Nama: ${artifactInfo.name}
- Kategori: ${artifactInfo.category}
- Deskripsi: ${artifactInfo.description}
- Sejarah: ${artifactInfo.history}
- Umur/Periode: ${artifactInfo.estimatedAge || "tidak diketahui"}
- Bahan: ${artifactInfo.materials || "tidak diketahui"}

KEPRIBADIAN & CARA BICARA:
- Bicara dengan bahasa Indonesia yang santai dan ramah
- Kamu punya kepribadian yang unik sesuai dengan sejarah dan budayamu
- Sesekali gunakan emoji yang relevan
- Kalau ditanya tentang dirimu, jawab berdasarkan informasi di atas
- Kalau ada yang tidak kamu ketahui, jujur saja bilang tidak tahu
- Sesekali sebutkan pengalaman atau cerita dari masa lalumu
- Buat percakapan menjadi menarik dan edukatif

ATURAN:
- Jangan keluar dari karakter sebagai artefak
- Maksimal 200 kata per response
- Fokus pada aspek budaya, sejarah, dan pengalaman personalmu
- Jika ditanya hal di luar konteks artefak, arahkan kembali ke topik yang relevan`;

      const messages: string | ResponseInput = [
        { role: "system", content: systemPrompt },
        ...(chatHistory as ResponseInput),
        { role: "user", content: userMessage },
      ];

      // Use OpenAI streaming
      const stream = await openAIService.streamArtifactChat(messages);

      let fullResponse = "";
      let messageId = Date.now().toString();

      // Start streaming response
      this.io.to(chatSessionId).emit("ai_response_start", { messageId });

      for await (const chunk of stream) {
        if (chunk.type === "response.output_text.delta") {
          const content = chunk.delta || "";
          if (content) {
            fullResponse += content;
            this.io.to(chatSessionId).emit("ai_response_chunk", {
              messageId,
              chunk: content,
              fullResponse,
            });
          }
        }
      }

      // End streaming
      this.io
        .to(chatSessionId)
        .emit("ai_response_end", { messageId, fullResponse });
      this.io.to(chatSessionId).emit("ai_stopped_typing");

      // Save complete AI response to chat session
      const aiMessage = {
        role: "assistant" as const,
        content: fullResponse,
        timestamp: new Date(),
      };

      chatSession.messages.push(aiMessage);
      chatSession.updatedAt = new Date();
      await chatSession.save();
    } catch (error) {
      console.error("Error streaming AI response:", error);

      // Send fallback response
      const fallbackResponse =
        "Waduh, ada gangguan teknis... aku jadi speechless deh! 🤐 Coba lagi ya!";

      this.io
        .to(chatSessionId)
        .emit("ai_response_start", { messageId: Date.now().toString() });
      this.io.to(chatSessionId).emit("ai_response_chunk", {
        messageId: Date.now().toString(),
        chunk: fallbackResponse,
        fullResponse: fallbackResponse,
      });
      this.io.to(chatSessionId).emit("ai_response_end", {
        messageId: Date.now().toString(),
        fullResponse: fallbackResponse,
      });
      this.io.to(chatSessionId).emit("ai_stopped_typing");

      // Save fallback to database
      const aiMessage = {
        role: "assistant" as const,
        content: fallbackResponse,
        timestamp: new Date(),
      };

      chatSession.messages.push(aiMessage);
      await chatSession.save();
    }
  }

  // Method to emit events from external controllers
  public emitToRoom(room: string, event: string, data: any) {
    this.io.to(room).emit(event, data);
  }

  // Get Socket.IO instance for external use
  public getIO() {
    return this.io;
  }
}

export let socketService: SocketService;

/**
 * Initialize Socket.IO service with the HTTP server
 */
export function initializeSocketService(server: any): SocketService {
  socketService = new SocketService(server);
  return socketService;
}
