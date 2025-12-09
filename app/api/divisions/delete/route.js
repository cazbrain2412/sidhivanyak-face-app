// app/api/divisions/delete/route.js
import dbConnect from "../../../../lib/mongodb";
import Division from "../../../../models/Division";

export async function POST(req) {
  try {
    await dbConnect();
    const { id } = await req.json();
    if (!id) {
      return new Response(JSON.stringify({ success: false, error: "Provide id to delete" }), { status: 400, headers: { "Content-Type": "application/json" }});
    }

    const deleted = await Division.findByIdAndDelete(id).lean();
    if (!deleted) {
      return new Response(JSON.stringify({ success: false, error: "Division not found" }), { status: 404, headers: { "Content-Type": "application/json" }});
    }
    return new Response(JSON.stringify({ success: true, deleted }), { status: 200, headers: { "Content-Type": "application/json" }});
  } catch (err) {
    console.error("division delete error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message || String(err) }), { status: 500, headers: { "Content-Type": "application/json" }});
  }
}

