import mongoose from "mongoose";

const EmployeeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true }, // employee unique code / ID

    name: { type: String, required: true },
    email: { type: String },
    mobile: { type: String },

    aadhar: { type: String },            // Hard card
    pfNumber: { type: String },
    esicNumber: { type: String },
    bankAccount: { type: String },
    ifsc: { type: String },
    address: { type: String },

    // Hierarchy
    zone: { type: String },
    division: { type: String },
    department: { type: String },
    category: { type: String },

    // Supervisor who manages this employee
    supervisorCode: { type: String },  

    // Face recognition descriptor
    faceDescriptor: { type: [Number], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.Employee ||
  mongoose.model("Employee", EmployeeSchema);

