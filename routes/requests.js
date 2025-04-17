const express = require("express");
const Request = require("../models/Request");
const Task = require("../models/Task");
const router = express.Router();

// ➤ Add a new resource request
router.post("/", async (req, res) => {
  const { requestedName, Task, hours, project, requester, department, Notes } = req.body;

  // Validate required fields
  if (!requestedName || !Task || !hours || !project || !requester || !department) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const newRequest = new Request(req.body);
    await newRequest.save();
    res.status(201).json(newRequest);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ➤ Update a request
router.put("/:id", async (req, res) => {
  try {
    const request = await Request.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!request) return res.status(404).json({ error: "Request not found" });
    res.json(request);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ➤ Delete a request
router.delete("/:id", async (req, res) => {
  try {
    const request = await Request.findByIdAndDelete(req.params.id);
    if (!request) return res.status(404).json({ error: "Request not found" });
    res.json({ message: "Request deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ➤ Get all pending requests (with optional filtering)
router.get("/", async (req, res) => {
  const { project, date } = req.query; // Query parameters for filtering
  const filter = { status: "Pending" };

  if (project) filter.project = project;
  if (date) filter.date = { $gte: new Date(date) }; // Filter by date (greater than or equal)

  try {
    const requests = await Request.find(filter).sort({ createdAt: -1 }); // Sort by creation date (newest first)
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ➤ Approve a request (Keep in `requests`, Copy to `tasks`)
router.put("/:id/approve", async (req, res) => {
  const { weekHours } = req.body;

  if (!weekHours || !Array.isArray(weekHours)) {
    return res.status(400).json({ error: "Missing or invalid weekHours array" });
  }

  // Validate weekHours
  const totalHours = weekHours.reduce((sum, day) => sum + (day.hours || 0), 0);
  if (totalHours > 40) {
    return res.status(400).json({ error: "Maximum 40 hours allowed per week" });
  }

  for (const day of weekHours) {
    if (day.hours > 8) {
      return res.status(400).json({ error: "Maximum 8 hours allowed per day" });
    }
  }

  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ error: "Request not found" });

    // Update the request in `requests`
    request.status = "Approved";
    request.weekHours = weekHours;
    await request.save();

    // Save the approved task in `tasks`
    const newTask = new Task({
      requestedName: request.requestedName,
      email: request.email,
      Task: request.Task,
      hours: request.hours,
      projectCode: request.projectCode,
      project: request.project,
      requester: request.requester,
      department: request.department,
      date: request.date,
      Notes: request.Notes,
      status: "Approved",
      weekHours, // Save the weekHours array
    });

    await newTask.save();

    res.json({ message: "Request approved", task: newTask });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ➤ Reject a request (Keep in `requests`, Copy to `tasks`)
router.put("/:id/reject", async (req, res) => {
  const { comment } = req.body;

  if (!comment) {
    return res.status(400).json({ error: "Comment is required for rejection" });
  }

  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ error: "Request not found" });

    // Update the request in `requests`
    request.status = "Rejected";
    request.comment = comment;
    await request.save();

    // Save the rejected task in `tasks`
    const newTask = new Task({
      requestedName: request.requestedName,
      email: request.email,
      Task: request.Task,
      hours: request.hours,
      date: request.date,
      projectCode: request.projectCode,
      project: request.project,
      requester: request.requester,
      department: request.department,
      Notes: request.Notes,
      status: "Rejected",
      comment,
    });

    await newTask.save();

    res.json({ message: "Request rejected", task: newTask });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;