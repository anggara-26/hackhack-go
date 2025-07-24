import express, { Router } from "express";
import {
  sendMessage,
  getChatSession,
  sendQuickQuestion,
  rateChatSession,
  getChatHistory,
  deleteChatSession,
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

// @route   GET /api/chat/:chatSessionId
// @desc    Get chat session with messages
// @access  Public
router.get("/:chatSessionId", getChatSession);

// @route   POST /api/chat/:chatSessionId/rate
// @desc    Rate chat session
// @access  Public
router.post("/:chatSessionId/rate", rateChatSession);

// @route   GET /api/chat/history
// @desc    Get user's chat history
// @access  Public
router.get("/", getChatHistory);

// @route   DELETE /api/chat/:chatSessionId
// @desc    Delete chat session
// @access  Public
router.delete("/:chatSessionId", deleteChatSession);

export default router;
