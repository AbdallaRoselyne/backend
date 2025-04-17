// models/Complete.js
const mongoose = require("mongoose");

const CompleteSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    actualHours: {
      type: Number,
      required: true,
      min: 0,
      max: 8,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    locked: {
      type: Boolean,
      default: false,
      required: true // Make this required
    },
    userEmail: {
      type: String,
      required: true,
    },
    project: {
      type: String,
      required: true,
    },
    taskTitle: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    // Compound index to ensure unique entries per task per date
    index: [
      { task: 1, date: 1, userEmail: 1 },
      { unique: true }
    ],
  }
);

module.exports = mongoose.model("Complete", CompleteSchema);