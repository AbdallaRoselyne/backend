const mongoose = require("mongoose");

const MemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    jobTitle: { type: String, required: true },
    discipline: { type: String, required: true },
    department: {
      type: String,
      enum: ["LEED", "BIM", "MEP", "ADMIN"],
      required: true,
    },
    billableRate: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Member", MemberSchema);
