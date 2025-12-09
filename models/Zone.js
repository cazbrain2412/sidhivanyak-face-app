import mongoose from "mongoose";

const ZoneSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
}, { timestamps: true });

export default mongoose.models.Zone || mongoose.model("Zone", ZoneSchema);

