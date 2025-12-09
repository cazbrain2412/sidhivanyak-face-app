// app/api/supervisors/delete/route.js
import dbConnect from "../../../../lib/mongodb";
import Supervisor from "../../../../models/Supervisor";
import Employee from "../../../../models/Employee";

export async function POST(req) {
  try {
    await dbConnect();
    const { code } = await req.json();

    if (!code) {
      return new Response(JSON.stringify({ success: false, error: "Supervisor code required" }), { status: 400, headers: { "Content-Type": "application/json" }});
    }

    // optionally reassign or clear supervisorCode of employees under this supervisor
    await Employee.updateMany({ supervisorCode: code }, { $unset: { supervisorCode: "" } }).catch(() => null);

    const deleted = await Supervisor.findOneAndDelete({ code }).lean();
    if (!deleted) {
      return new Response(JSON.stringify({ success: false, error: "Supervisor not found" }), { status: 404, headers: { "Content-Type": "application/json" }});
    }

    return new Response(JSON.stringify({ success: true, deleted }), { status: 200, headers: { "Content-Type": "application/json" }});
  } catch (err) {
    console.error("supervisor delete error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message || String(err) }), { status: 500, headers: { "Content-Type": "application/json" }});
  }
}

