import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema(
  {
    employeeCode: { type: String, required: true },
    employeeName: { type: String },

    // *** REQUIRED FIELD (your schema missed it) ***
    date: { type: String }, // YYYY-MM-DD

    // Punch times
    punchIn: { type: Date },
    punchOut: { type: Date },

    // Derived logic fields
    hoursWorked: { type: Number },
    status: {
      type: String,
      enum: ["PRESENT", "HALF", "ABSENT"],
      default: "ABSENT"
    },

    // Source raw punch event references
    sourceEvents: [{ type: String }],

    // Allow raw punch event documents (timestamp-only)
    timestamp: { type: Date },

    supervisorCode: { type: String },
    zone: { type: String },
    division: { type: String },
    department: { type: String }
  },
  { timestamps: true, strict: false } // ← strict:false allows upsert without errors
);

export default mongoose.models.Attendance ||
  mongoose.model("Attendance", AttendanceSchema);

