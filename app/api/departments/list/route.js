// app/api/departments/list/route.js
import dbConnect from "../../../../lib/mongodb";
import Department from "../../../../models/Department";

export async function GET() {
  try {
    await dbConnect();
    const depts = await Department.find().sort({ name: 1 }).lean();
    return new Response(JSON.stringify({ success: true, departments: depts }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("departments list error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

