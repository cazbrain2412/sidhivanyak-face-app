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
    } catch {
      return new Response(JSON.stringify({ success: false, error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const supervisorFromQuery = url.searchParams.get("code");

    await dbConnect();

    // ✅ SUPERVISOR LOGIN
    if (decoded.role === "supervisor") {
      const employees = await Employee.find({
        supervisorCode: decoded.code,
      }).lean();

      return Response.json({ success: true, employees });
    }

    // ✅ ADMIN / ZONE ADMIN
    if ((decoded.role === "admin" || decoded.role === "zoneadmin") && supervisorFromQuery) {
      const employees = await Employee.find({
        supervisorCode: supervisorFromQuery,
      }).lean();

      return Response.json({ success: true, employees });
    }

    return Response.json(
      { success: false, employees: [] },
      { status: 200 }
    );
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

