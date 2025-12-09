import dbConnect from "../../../../lib/mongodb";
import Employee from "../../../../models/Employee";

export async function GET() {
  try {
    await dbConnect();
    const employees = await Employee.find().sort({ createdAt: -1 }).lean();
    return new Response(JSON.stringify({ success: true, employees }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("employees list error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message || String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
