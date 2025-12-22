import mongoose from "mongoose";

const SupervisorAttendanceSchema = new mongoose.Schema(
  {
    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supervisor",
      required: true,
    },
    supervisorName: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    punchIn: {
      type: Date,
    },
    punchOut: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["HALF", "FULL"],
      default: "HALF",
    },
    location: {
      lat: Number,
      lng: Number,
      accuracy: Number,
      locationName: String,
    },
  },
  { timestamps: true }
);

export default mongoose.models.SupervisorAttendance ||
  mongoose.model("SupervisorAttendance", SupervisorAttendanceSchema);

