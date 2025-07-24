import { sessionsController } from "@/controller";
import express, { Response, Request, Express } from "express";

const route = express.Router();

// @route   GET /api/sessions
// @desc    Used to get the ephemeral session data
// @access  Public
route.get("/", sessionsController.createEphemeralToken);

export default route;
