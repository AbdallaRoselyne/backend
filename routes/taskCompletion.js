// routes/taskCompletion.js
const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const Complete = require("../models/Complete");

const normalizeDate = (date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};
// Get completions with filters
router.get('/', async (req, res) => {
  try {
    const { userEmail, startDate, endDate } = req.query;
    
    if (!userEmail) {
      return res.status(400).json({ 
        success: false,
        message: 'User email is required' 
      });
    }

    const filter = { userEmail };
    
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const completions = await Complete.find(filter)
      .sort({ date: -1 })
      .populate('task', 'Task project requester');
      
    res.json({
      success: true,
      data: completions
    });
  } catch (error) {
    console.error('Error fetching completions:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch completions', 
      error: error.message 
    });
  }
});

// Get all completions (admin only)
router.get('/all', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const filter = {};
    
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const completions = await Complete.find(filter)
      .sort({ date: -1 })
      .populate('task', 'Task project requester');
      
    res.json({
      success: true,
      data: completions
    });
  } catch (error) {
    console.error('Error fetching all completions:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch completions', 
      error: error.message 
    });
  }
});

router.post("/:taskId/complete", async (req, res) => {
  const { taskId } = req.params;
  const { date, actualHours, completed } = req.body;

  try {
    // Validate input
    if (!date || isNaN(normalizeDate(date).getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format"
      });
    }

    if (typeof actualHours !== 'number' || actualHours > 8 || actualHours < 0) {
      return res.status(400).json({
        success: false,
        message: "Actual hours must be a number between 0 and 8"
      });
    }

    const targetDate = normalizeDate(date);

    // Check for existing locked completion first
    const existingCompletion = await Complete.findOne({
      task: taskId,
      date: targetDate,
      locked: true
    });

    if (existingCompletion) {
      return res.status(400).json({
        success: false,
        message: "This date is completed and locked - no further edits allowed",
        locked: true
      });
    }

    // Find and update the task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    // Find the specific week day to update
    const weekDay = task.weekHours.find(day => 
      normalizeDate(day.date).getTime() === targetDate.getTime()
    );

    if (!weekDay) {
      return res.status(404).json({
        success: false,
        message: "Date not found in task's week hours"
      });
    }

    // Update the task's weekHours
    weekDay.actualHours = actualHours;
    weekDay.completed = completed;
    task.updatedAt = new Date();

    // Determine if we should lock this completion
    const shouldLock = completed && actualHours > 0;

    // Create or update the completion record
    const completionData = {
      task: taskId,
      date: targetDate,
      actualHours,
      completed,
      locked: shouldLock,
      userEmail: task.email,
      project: task.project,
      taskTitle: task.Task
    };

    // Use findOneAndUpdate with upsert to ensure atomic operation
    const completion = await Complete.findOneAndUpdate(
      { task: taskId, date: targetDate },
      completionData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Save the updated task
    const updatedTask = await task.save();

    return res.json({
      success: true,
      message: shouldLock ? 
        "Daily progress saved and locked" : 
        "Daily progress saved",
      task: updatedTask,
      completion,
      locked: shouldLock
    });

  } catch (error) {
    console.error("Completion error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save daily progress",
      error: error.message
    });
  }
});

// In your taskCompletion routes file
router.get("/:taskId/completions", async (req, res) => {
  try {
    const completions = await Complete.find({ task: req.params.taskId });
    res.json(completions);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch completion records",
      error: error.message
    });
  }
});

module.exports = router;