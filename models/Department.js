// models/Department.js
import mongoose from "mongoose";

const DepartmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    code: { type: String }, // optional short code e.g. HR, FIN
    description: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Department || mongoose.model("Department", DepartmentSchema);

