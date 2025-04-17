const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  code: { type: String, required: true }, // Not unique, can be repeated across departments
  name: { type: String, required: true }, // Not unique, can be repeated across departments
  department: {
    type: String,
    enum: ["LEED", "BIM", "MEP"],
    required: true,
  },
  budget: { type: Number, required: true },
  hours: { type: Number, required: true },
  teamLeader: { type: String, required: true },
  director: { type: String, required: true },
  stage: {
    type: String,
    enum: [
      "Preparation and Brief",
      "Survey",
      "Concept Design",
      "Draft EA Report",
      "Final EA Report",
      "Detailed Design",
      "Technical Design",
      "Construction",
    ],
    required: true,
  },
  hoursLogged: { type: Number, default: 0 },
  spent: { type: Number, default: 0 },
});

module.exports = mongoose.model("Project", projectSchema);