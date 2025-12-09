// app/api/divisions/create/route.js
import dbConnect from "../../../../lib/mongodb";
import Division from "../../../../models/Division";
import Zone from "../../../../models/Zone";

export async function POST(req) {
  try {
    await dbConnect();
    const { name, zoneId } = await req.json();

    if (!name || !zoneId) {
      return new Response(JSON.stringify({ success: false, error: "name and zoneId required" }), { status: 400, headers: { "Content-Type": "application/json" }});
    }

    // ensure zone exists
    const z = await Zone.findById(zoneId).lean();
    if (!z) {
      return new Response(JSON.stringify({ success: false, error: "Zone not found" }), { status: 404, headers: { "Content-Type": "application/json" }});
    }

    const div = await Division.create({ name: name.trim(), zoneId });
    return new Response(JSON.stringify({ success: true, division: div }), { status: 201, headers: { "Content-Type": "application/json" }});
  } catch (err) {
    console.error("division create error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message || String(err) }), { status: 500, headers: { "Content-Type": "application/json" }});
  }
}

