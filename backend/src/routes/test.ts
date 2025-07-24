import express, { Request, Response, Router } from "express";

const router: Router = express.Router();

// @route   GET /api/test
// @desc    Test route
// @access  Public
router.get("/test", (req: Request, res: Response) => {
  res.json({
    message: "Test route is working!",
    timestamp: new Date().toISOString(),
  });
});

export default router;
