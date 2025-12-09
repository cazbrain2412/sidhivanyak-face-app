// app/api/employees/descriptors/route.js
import dbConnect from "../../../../lib/mongodb";
import Employee from "../../../../models/Employee";

export async function GET() {
  try {
    await dbConnect();

    // return only employees that have a faceDescriptor stored
    const rows = await Employee.find(
      { faceDescriptor: { $exists: true, $ne: [] } },
      { code: 1, name: 1, faceDescriptor: 1 }
    ).lean();

    return new Response(JSON.stringify({ success: true, employees: rows }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("descriptors error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message || String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

