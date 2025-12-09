// models/Supervisor.js
import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema({
  type: { type: String },    // e.g. "aadhar", "bank_passbook", "pan", "family_aadhar"
  filename: { type: String },
  url: { type: String },
}, { _id: false });

const SupervisorSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // supervisor id/code
  name: { type: String, required: true },
  gender: { type: String, enum: ["male","female","other"], default: null },
  mobile: { type: String, required: true },
  address: { type: String, default: null },
  dob: { type: Date, default: null },
  doj: { type: Date, default: null },

  // IDs / numbers
  aadhar: { type: String, default: null },
  pan: { type: String, default: null },
  pfNumber: { type: String, default: null },   // PF / TF number
  esicNumber: { type: String, default: null },

  // Bank
  bankAccount: { type: String, default: null },
  ifsc: { type: String, default: null },
  bankBranch: { type: String, default: null },

  // Org assignment
  zone: { type: String, default: null },
  division: { type: String, default: null },
  department: { type: String, default: null },

  // Documents metadata (files stored separately)
  documents: { type: [DocumentSchema], default: [] },

  // Face descriptor for recognition (same format as Employee)
  faceDescriptor: { type: [Number], default: [] },

  // Auth
  passwordHash: { type: String, default: null },

  // created by (superadmin code)
  createdBy: { type: String, default: null },
}, { timestamps: true });

export default mongoose.models.Supervisor || mongoose.model("Supervisor", SupervisorSchema);

