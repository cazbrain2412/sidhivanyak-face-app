import mongoose from "mongoose";

const DivisionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  zoneId: { type: mongoose.Schema.Types.ObjectId, ref: "Zone", required: true },
}, { timestamps: true });

export default mongoose.models.Division || mongoose.model("Division", DivisionSchema);

