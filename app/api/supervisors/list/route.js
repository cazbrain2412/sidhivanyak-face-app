// app/api/supervisors/list/route.js
import dbConnect from "../../../../lib/mongodb";
import Supervisor from "../../../../models/Supervisor";

export async function GET() {
  try {
    await dbConnect();
    const rows = await Supervisor.find().sort({ createdAt: -1 }).lean();

    // remove sensitive fields
    const out = (rows || []).map((r) => ({
      code: r.code,
      name: r.name,
      email: r.email || null,
      mobile: r.mobile || null,
      zone: r.zone || null,
      division: r.division || null,
      createdAt: r.createdAt,
    }));

    return new Response(JSON.stringify({ success: true, supervisors: out }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("supervisors list error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message || String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

