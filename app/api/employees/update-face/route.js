// app/api/employees/update-face/route.js
import dbConnect from "../../../../lib/mongodb";
import Employee from "../../../../models/Employee";

export async function POST(req) {
  try {
    const { code, descriptor } = await req.json();

    if (!code) {
      return new Response(JSON.stringify({ success: false, error: "Missing employee code" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!descriptor || !Array.isArray(descriptor)) {
      return new Response(JSON.stringify({ success: false, error: "Missing or invalid descriptor (array expected)" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await dbConnect();

    const emp = await Employee.findOneAndUpdate(
      { code },
      { $set: { faceDescriptor: descriptor } },
      { new: true, upsert: false }
    );

    if (!emp) {
      return new Response(JSON.stringify({ success: false, error: "Employee not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, employee: emp }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("update-face error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message || String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

