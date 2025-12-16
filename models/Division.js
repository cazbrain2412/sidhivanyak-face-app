import mongoose from "mongoose";

const DivisionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    zoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Zone",
      required: true,
    },

    // ✅ NEW ATTENDANCE CONFIG
    attendanceType: {
      type: String,
      enum: ["SINGLE_PUNCH", "DOUBLE_PUNCH"],
      default: "DOUBLE_PUNCH",
    },

    minHoursForPresent: {
      type: Number,
      default: 2,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Division ||
  mongoose.model("Division", DivisionSchema);

