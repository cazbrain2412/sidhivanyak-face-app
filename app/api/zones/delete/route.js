// app/api/zones/delete/route.js
import dbConnect from "../../../../lib/mongodb";
import Zone from "../../../../models/Zone";

export async function POST(req) {
  try {
    await dbConnect();
    const { id, name } = await req.json();

    if (!id && !name) {
      return new Response(JSON.stringify({ success: false, error: "Provide id or name to delete" }), { status: 400, headers: { "Content-Type": "application/json" }});
    }

    const filter = id ? { _id: id } : { name };
    const deleted = await Zone.findOneAndDelete(filter).lean();

    if (!deleted) {
      return new Response(JSON.stringify({ success: false, error: "Zone not found" }), { status: 404, headers: { "Content-Type": "application/json" }});
    }

    return new Response(JSON.stringify({ success: true, deleted }), { status: 200, headers: { "Content-Type": "application/json" }});
  } catch (err) {
    console.error("zone delete error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message || String(err) }), { status: 500, headers: { "Content-Type": "application/json" }});
  }
}

