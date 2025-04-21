const express = require("express");
const router = express.Router();
const roleMiddleware = require("../middleware/roleMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

// Admin-only route
router.get("/Admin/dashboard", roleMiddleware("admin"), (req, res) => {
  res.json({ message: "Welcome to the admin dashboard" });
});

// User-only route
router.get("/dashboard", authMiddleware, (req, res) => {
  res.json({ message: "Welcome to the user dashboard" });
});

// Add this new route for checking session
router.get("/check-session", authMiddleware, (req, res) => {
  res.json({ 
    valid: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    }
  });
});

module.exports = router;