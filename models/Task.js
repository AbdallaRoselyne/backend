const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  requestedName: { type: String, required: true },
  email: { type: String, required: true },
  Task: { type: String, required: true },
  hours: { type: Number, required: true },
  projectCode: { type: String },
  project: { type: String, required: true },
  requester: { type: String, required: true },
  department: { type: String, required: true },
  date: { type: Date, default: Date.now },
  Notes: { type: String },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
  approvedHours: { type: Number },
  weekHours: [
    {
      day: { type: String, required: true }, // e.g., "Monday"
      date: { type: Date, required: true }, // Specific date for the day
      hours: { type: Number, required: true }, // Hours allocated for the day
    },
  ],
  comment: { type: String }, // For rejection comments
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Task", taskSchema);