import mongoose from "mongoose";

const ZoneAdminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    mobile: {
      type: String,
      required: true,
    },

    hardCardNumber: {
      type: String,
      default: "",
    },

    employeeCode: {
      type: String,
      default: "",
    },

    pfNumber: {
      type: String,
      default: "",
    },

    esicNumber: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      default: "",
    },

    assignedZones: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Zone",
        required: true,
      },
    ],

    role: {
      type: String,
      enum: ["ZONE_ADMIN"],
      default: "ZONE_ADMIN",
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.ZoneAdmin ||
  mongoose.model("ZoneAdmin", ZoneAdminSchema);

