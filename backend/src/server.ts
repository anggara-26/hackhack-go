import express, { Application, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import connectDB from "./config/database";
import testRoutes from "./routes/test";
import sessionRoutes from "./routes/sessions";
import authRoutes from "./routes/auth";
import artifactRoutes from "./routes/artifacts";
import chatRoutes from "./routes/chat";
import voiceRoutes from "./routes/voice";
// import otpRoutes from "./routes/otp";
import { errorController } from "./controller";
import { emailService } from "./utils/email";
import { initializeSocketService } from "./services/socketService";

// Load environment variables
dotenv.config();

const app: Application = express();
const server = http.createServer(app);
const PORT: number = parseInt(process.env.PORT as string) || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to database
connectDB();

// Initialize Socket.IO service
const socketServiceInstance = initializeSocketService(server);

// Routes
app.use("/api", testRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/artifacts", artifactRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/voice", voiceRoutes);
// app.use("/api/otp", otpRoutes);

app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Hackathon Backend API",
    status: "Server is running!",
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "OK",
    database:
      mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    uptime: process.uptime(),
  });
});

// Error handling middleware
app.use(errorController.errorHandler);

// 404 handler
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

// Start server
server.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🌐 Socket.IO service initialized`);

  // Verify email service connection
  const emailConnected = await emailService.verifyConnection();
  console.log(
    `📧 Email service: ${emailConnected ? "Connected" : "Failed to connect"}`
  );
});

export default app;
