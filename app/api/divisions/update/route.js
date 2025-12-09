// app/api/divisions/update/route.js
import dbConnect from "../../../../lib/mongodb";
import Division from "../../../../models/Division";
import Zone from "../../../../models/Zone";
import mongoose from "mongoose";

export async function POST(req) {
  try {
    await dbConnect();
    const { id, name, zoneId } = await req.json();

    if (!id || (!name && !zoneId)) {
      return new Response(JSON.stringify({ success: false, error: "Provide id and at least one field to update" }), { status: 400, headers: { "Content-Type": "application/json" }});
    }

    const update = {};
    if (name) update.name = name.trim();
    if (zoneId) {
      if (!mongoose.Types.ObjectId.isValid(zoneId)) {
        return new Response(JSON.stringify({ success: false, error: "Invalid zoneId" }), { status: 400, headers: { "Content-Type": "application/json" }});
      }
      const z = await Zone.findById(zoneId).lean();
      if (!z) {
        return new Response(JSON.stringify({ success: false, error: "Zone not found" }), { status: 404, headers: { "Content-Type": "application/json" }});
      }
      update.zoneId = zoneId;
    }

    const updated = await Division.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!updated) {
      return new Response(JSON.stringify({ success: false, error: "Division not found" }), { status: 404, headers: { "Content-Type": "application/json" }});
    }
    return new Response(JSON.stringify({ success: true, division: updated }), { status: 200, headers: { "Content-Type": "application/json" }});
  } catch (err) {
    console.error("division update error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message || String(err) }), { status: 500, headers: { "Content-Type": "application/json" }});
  }
}

