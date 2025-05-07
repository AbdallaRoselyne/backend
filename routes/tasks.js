const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const Complete = require("../models/Complete");

// Helper function to normalize dates
const normalizeDate = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Enhanced task fetching with week-based filtering
router.get("/", async (req, res) => {
  const { status, project, weekStart } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (project) filter.project = project;

  try {
    let tasks = await Task.find(filter).sort({ createdAt: -1 });

    // If weekStart is provided, filter tasks for that week
    if (weekStart) {
      const startDate = new Date(weekStart);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7); // Get the entire week

      tasks = tasks.filter((task) => {
        if (task.weekHours && task.weekHours.length > 0) {
          return task.weekHours.some((wh) => {
            const whDate = new Date(wh.date);
            return whDate >= startDate && whDate < endDate;
          });
        }
        return false;
      });
    }

    // Flatten tasks with weekHours
    const flattenedTasks = tasks.flatMap((task) => {
      if (
        task.status === "Approved" &&
        task.weekHours &&
        task.weekHours.length > 0
      ) {
        return task.weekHours.map((weekHour) => ({
          ...task.toObject(),
          _id: `${task._id}-${weekHour.date}`,
          approvedHours: weekHour.hours,
          date: weekHour.date,
          weekHours: task.weekHours, // Include all week hours for editing
        }));
      }
      return [task];
    });

    res.json(flattenedTasks);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch tasks", error: error.message });
  }
});

// Add this route to your existing tasks.js backend file
router.get("/user/:email", async (req, res) => {
  try {
    const userEmail = req.params.email;
    console.log(`Fetching tasks for email: ${userEmail}`); // Debug log

    if (!userEmail) {
      return res.status(400).json({ message: "Email parameter is required" });
    }

    // Case-insensitive search for email
    const tasks = await Task.find({
      email: { $regex: new RegExp(`^${userEmail}$`, "i") },
    }).sort({ createdAt: -1 });

    console.log(`Found ${tasks.length} tasks for ${userEmail}`); // Debug log

    res.json(tasks);
  } catch (error) {
    console.error("Error fetching user tasks:", error);
    res.status(500).json({
      message: "Failed to fetch user tasks",
      error: error.message,
    });
  }
});

// Enhanced task update endpoint
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { weekHours, ...updateData } = req.body;

  try {
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Convert dates to proper Date objects if weekHours are provided
    if (weekHours && Array.isArray(weekHours)) {
      task.weekHours = weekHours.map((wh) => ({
        day: wh.day,
        date: new Date(wh.date),
        hours: wh.hours,
      }));
    }

    // Update other fields except _id and internal fields
    const { _id, __v, createdAt, ...safeUpdate } = updateData;
    Object.assign(task, safeUpdate);
    task.updatedAt = Date.now();

    await task.save();

    // Return the updated task with proper weekHours
    const result = task.toObject();
    result.weekHours = result.weekHours.map((wh) => ({
      ...wh,
      date: wh.date.toISOString(),
    }));

    res.json(result);
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({
      message: "Failed to update task",
      error: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Enhanced delete endpoint
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const { date } = req.query;

  // Clean the ID if it has appended data
  const cleanId = id.length > 24 ? id.substring(0, 24) : id;

  try {
    const task = await Task.findById(cleanId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (date) {
      // Parse the date string (YYYY-MM-DD format)
      const targetDate = new Date(date);
      if (isNaN(targetDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }

      // Normalize dates for comparison (ignore time components)
      targetDate.setHours(0, 0, 0, 0);

      // Delete specific date
      const initialLength = task.weekHours.length;
      task.weekHours = task.weekHours.filter((wh) => {
        const whDate = new Date(wh.date);
        whDate.setHours(0, 0, 0, 0);
        return whDate.getTime() !== targetDate.getTime();
      });

      if (task.weekHours.length === initialLength) {
        return res.status(404).json({ message: "Date not found in task" });
      }

      if (task.weekHours.length === 0) {
        await Task.findByIdAndDelete(id);
        return res.json({ message: "Task deleted (no remaining dates)" });
      }

      await task.save();
      return res.json({
        message: "Date deleted successfully",
        task: {
          ...task.toObject(),
          weekHours: task.weekHours.map((wh) => ({
            ...wh,
            date: wh.date.toISOString(),
          })),
        },
      });
    } else {
      await Task.findByIdAndDelete(id);
      return res.json({ message: "Task deleted successfully" });
    }
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({
      message: "Failed to delete task",
      error: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

module.exports = router;
