const mongoose = require("mongoose");

const MemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    jobTitle: { type: String, required: true },
    discipline: { type: String, required: true },
    department: {
      type: String,
      enum: ["LEED", "BIM", "MEP"],
      required: true,
    },
    billableRate: { type: Number, required: true }, // Stored in Mauritian Rupees (MUR)
  },
  { timestamps: true }
);

module.exports = mongoose.model("Member", MemberSchema);
