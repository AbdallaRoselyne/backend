const express = require("express");
const router = express.Router();
const Member = require("../models/Member");

// Add a new member
router.post("/", async (req, res) => {
  const { name, email, jobTitle, discipline, department, billableRate } = req.body;

  // Validate email domain
  const emailRegex = /^[a-zA-Z0-9._%+-]+@prodesign\.mu$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Email must be a @prodesign.mu address." });
  }

  // Validate other fields
  if (!name || !jobTitle || !discipline || !department || !billableRate) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const newMember = new Member({ name, email, jobTitle, discipline, department, billableRate });
    const savedMember = await newMember.save();
    res.status(201).json(savedMember);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all members
router.get("/", async (req, res) => {
  try {
    const members = await Member.find();
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a member
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, jobTitle, discipline, department, billableRate } = req.body;

  // Validate email domain
  const emailRegex = /^[a-zA-Z0-9._%+-]+@prodesign\.mu$/;
  if (email && !emailRegex.test(email)) {
    return res.status(400).json({ message: "Email must be a @prodesign.mu address." });
  }

  try {
    const updatedMember = await Member.findByIdAndUpdate(
      id,
      { name, email, jobTitle, discipline, department, billableRate },
      { new: true }
    );

    if (!updatedMember) {
      return res.status(404).json({ message: "Member not found" });
    }

    res.json(updatedMember);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a member
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedMember = await Member.findByIdAndDelete(id);

    if (!deletedMember) {
      return res.status(404).json({ message: "Member not found" });
    }

    res.json({ message: "Member deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
