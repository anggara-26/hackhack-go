const express = require("express");
const router = express.Router();

// @route   GET /api/test
// @desc    Test route
// @access  Public
router.get("/test", (req, res) => {
  res.json({
    message: "Test route is working!",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
