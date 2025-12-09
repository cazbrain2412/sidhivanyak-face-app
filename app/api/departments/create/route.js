// app/api/departments/create/route.js
import dbConnect from "../../../../lib/mongodb";
import Department from "../../../../models/Department";

export async function POST(req) {
  try {
    await dbConnect();
    const { name, code, description } = await req.json();

    if (!name || !name.trim()) {
      return new Response(JSON.stringify({ success: false, error: "Department name required" }), { status: 400, headers: { "Content-Type": "application/json" }});
    }

    // prevent duplicate names
    const existing = await Department.findOne({ name: name.trim() }).lean();
    if (existing) {
      return new Response(JSON.stringify({ success: false, error: "Department already exists" }), { status: 409, headers: { "Content-Type": "application/json" }});
    }

    const dept = await Department.create({ name: name.trim(), code: code || null, description: description || null });
    return new Response(JSON.stringify({ success: true, department: dept }), { status: 201, headers: { "Content-Type": "application/json" }});
  } catch (err) {
    console.error("department create error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message || String(err) }), { status: 500, headers: { "Content-Type": "application/json" }});
  }
}

