// app/api/zones/update/route.js
import dbConnect from "../../../../lib/mongodb";
import Zone from "../../../../models/Zone";

export async function POST(req) {
  try {
    await dbConnect();
    const { id, name, newName } = await req.json();

    if (!id && !name) {
      return new Response(JSON.stringify({ success: false, error: "Provide id or name to update" }), { status: 400, headers: { "Content-Type": "application/json" }});
    }
    if (!newName || !newName.trim()) {
      return new Response(JSON.stringify({ success: false, error: "Provide newName" }), { status: 400, headers: { "Content-Type": "application/json" }});
    }

    const filter = id ? { _id: id } : { name };
    const updated = await Zone.findOneAndUpdate(filter, { name: newName.trim() }, { new: true }).lean();

    if (!updated) {
      return new Response(JSON.stringify({ success: false, error: "Zone not found" }), { status: 404, headers: { "Content-Type": "application/json" }});
    }

    return new Response(JSON.stringify({ success: true, zone: updated }), { status: 200, headers: { "Content-Type": "application/json" }});
  } catch (err) {
    console.error("zone update error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message || String(err) }), { status: 500, headers: { "Content-Type": "application/json" }});
  }
}

