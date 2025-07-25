import express, { Router } from "express";
import {
  sendMessage,
  getChatSession,
  sendQuickQuestion,
  rateChatSession,
  getChatHistory,
  deleteChatSession,
  getChatSessionFromArtifact,
} from "../controller/chatController";

const router: Router = express.Router();

// @route   POST /api/chat/:chatSessionId/send
// @desc    Send message to artifact
// @access  Public
router.post("/:chatSessionId/send", sendMessage);

// @route   POST /api/chat/:chatSessionId/quick-question
// @desc    Send quick question to artifact
// @access  Public
router.post("/:chatSessionId/quick-question", sendQuickQuestion);

// @route   POST /api/chat/:chatSessionId/rate
// @desc    Rate chat session
// @access  Public
router.post("/:chatSessionId/rate", rateChatSession);

// @route   GET /api/chat/
// @desc    Get user's chat history
// @access  Public
router.get("/history", getChatHistory);

// @route   DELETE /api/chat/:chatSessionId
// @desc    Delete chat session
// @access  Public
router.delete("/:chatSessionId", deleteChatSession);

// @route   GET /api/chat/get-artifact-session/:chatSessionId
// @desc    Get artifact session
// @access  Public
router.get("/get-artifact-session/:artifactId", getChatSessionFromArtifact);

// @route   GET /api/chat/:chatSessionId
// @desc    Get chat session with messages
// @access  Public
router.get("/:chatSessionId", getChatSession);

export default router;
