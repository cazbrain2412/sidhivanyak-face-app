// app/api/employees/by-supervisor/route.js
import dbConnect from "../../../../lib/mongodb";
import Employee from "../../../../models/Employee";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret123";

export async function GET(req) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth) {
      return new Response(JSON.stringify({ success: false, error: "No token provided" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const token = auth.replace("Bearer ", "").trim();
    let decoded;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: "Invalid or expired token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supervisorCode = decoded.code;

    await dbConnect();

    // fetch employees managed by this supervisor
    const employees = await Employee.find({ supervisorCode }).lean();

    return new Response(JSON.stringify({ success: true, employees }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message || String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

