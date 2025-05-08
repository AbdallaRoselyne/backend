const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  requestedName: { type: String, required: true },
  email: { type: String, required: true },
  Task: { type: String, required: true },
  hours: { type: Number, required: true },
  projectCode: { type: String, default: "" }, 
  project: { type: String, required: true },
  requester: { type: String, required: true },
  department: { type: String, required: true },
  Notes: { type: String, default: "" },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
  approvedHours: { type: Number, default: 0 },
  timeSlot: { type: String, default: "" },
  comment: { type: String, default: "" },
  date: { type: Date, default: Date.now },
  isCustomProject: { type: Boolean, default: false }, 
});

module.exports = mongoose.model("Request", requestSchema);
