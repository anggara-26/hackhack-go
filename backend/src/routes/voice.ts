import express, { Router } from "express";
import {
  initializeVoiceCall,
  endVoiceCall,
  getVoiceCallHistory,
} from "../controller/voiceController";

const router: Router = express.Router();

// @route   POST /api/voice/:chatSessionId/start
// @desc    Initialize voice call session with artifact
// @access  Public
router.post("/:chatSessionId/start", initializeVoiceCall);

// @route   POST /api/voice/end/:interactionId
// @desc    End voice call and save transcript
// @access  Public
router.post("/end/:interactionId", endVoiceCall);

// @route   GET /api/voice/history
// @desc    Get user's voice call history
// @access  Public
router.get("/history", getVoiceCallHistory);

export default router;
