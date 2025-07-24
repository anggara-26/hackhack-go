import { sessionsController } from "@/controller";
import { authenticate } from "@/middleware/auth";
import express, { Response, Request, Express } from "express";

const route = express.Router();

// @route   GET /api/sessions
// @desc    Used to get the ephemeral session data
// @access  Private (requires authentication)
route.get("/", authenticate, sessionsController.createEphemeralToken);

export default route;
