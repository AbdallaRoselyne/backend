const express = require("express");
const router = express.Router();
const roleMiddleware = require("../middleware/roleMiddleware");

// Admin-only route
router.get("/Admin/dashboard", roleMiddleware("admin"), (req, res) => {
  res.json({ message: "Welcome to the admin dashboard" });
});

// User-only route
router.get("/dashboard", (req, res) => {
  res.json({ message: "Welcome to the user dashboard" });
});

module.exports = router;