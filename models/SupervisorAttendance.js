import mongoose from "mongoose";

const SupervisorAttendanceSchema = new mongoose.Schema(
  {
    // 🔑 Supervisor identity
    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supervisor",
      required: true,
    },
    supervisorCode: {                 // ✅ REQUIRED FOR REPORTS
      type: String,
      required: true,
      index: true,
    },
    supervisorName: {
      type: String,
      required: true,
    },

    // 📅 Attendance date
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },

    // ⏱ Punch timings
    punchIn: {
      type: Date,
    },
    punchOut: {
      type: Date,
    },

    // 📊 Status
    status: {
      type: String,
      enum: ["HALF", "FULL"],
      default: "HALF",
    },

    // 📍 Location info
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

