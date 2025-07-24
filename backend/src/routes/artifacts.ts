import express, { Router } from "express";
import {
  uploadAndIdentifyArtifact,
  getArtifactHistory,
  getArtifactById,
  serveImage,
  deleteArtifact,
} from "../controller/artifactController";
import { uploadMiddleware } from "../utils/imageUpload";

const router: Router = express.Router();

// @route   POST /api/artifacts/upload
// @desc    Upload and identify artifact
// @access  Public
router.post(
  "/upload",
  uploadMiddleware.single("image"),
  uploadAndIdentifyArtifact
);

// @route   GET /api/artifacts/history
// @desc    Get user's artifact history
// @access  Public
router.get("/history", getArtifactHistory);

// @route   GET /api/artifacts/:id
// @desc    Get single artifact with details
// @access  Public
router.get("/:id", getArtifactById);

// @route   GET /api/artifacts/images/:filename
// @desc    Serve artifact images
// @access  Public
router.get("/images/:filename", serveImage);

// @route   DELETE /api/artifacts/:id
// @desc    Delete artifact and associated data
// @access  Public
router.delete("/:id", deleteArtifact);

export default router;
