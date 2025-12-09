// app/api/departments/update/route.js
import dbConnect from "../../../../lib/mongodb";
import Department from "../../../../models/Department";

export async function POST(req) {
  try {
    await dbConnect();
    const { id, name, code, description } = await req.json();

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: "Department id required" }), { status: 400, headers: { "Content-Type": "application/json" }});
    }
    if (!name && !code && !description) {
      return new Response(JSON.stringify({ success: false, error: "Provide at least one field to update" }), { status: 400, headers: { "Content-Type": "application/json" }});
    }

    const update = {};
    if (name) update.name = name.trim();
    if (code !== undefined) update.code = code || null;
    if (description !== undefined) update.description = description || null;

    const updated = await Department.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!updated) {
      return new Response(JSON.stringify({ success: false, error: "Department not found" }), { status: 404, headers: { "Content-Type": "application/json" }});
    }

    return new Response(JSON.stringify({ success: true, department: updated }), { status: 200, headers: { "Content-Type": "application/json" }});
  } catch (err) {
    console.error("department update error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message || String(err) }), { status: 500, headers: { "Content-Type": "application/json" }});
  }
}

