const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Restrict to @prodesign.mu users
  if (!email.endsWith("@prodesign.mu")) {
    return res
      .status(403)
      .json({ message: "Access restricted to @prodesign.mu users" });
  }

  try {
    let user = await User.findOne({ email });

    // If user doesn't exist, create a new user
    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const role = email === "farahnaz.sairally@prodesign.mu" || email === "planner@prodesign.mu" ? "admin" : "user";
      user = new User({ email, password: hashedPassword, role });
      await user.save();
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT token with role
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "20min",
      }
    );

    res.json({ token, role: user.role, message: "Login successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get('/check-session', authMiddleware, (req, res) => {
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