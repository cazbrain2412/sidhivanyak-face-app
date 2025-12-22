import dbConnect from "../../../../lib/mongodb";
import Employee from "../../../../models/Employee";
import jwt from "jsonwebtoken";

export async function GET(req) {
  await dbConnect();

  try {
    const url = new URL(req.url);
    const supervisorCodeFromQuery = url.searchParams.get("code");

    // 🔹 ADMIN / ZONE ADMIN FLOW (no token needed)
    if (supervisorCodeFromQuery) {
      const employees = await Employee.find({
        supervisorCode: supervisorCodeFromQuery,
      }).lean();

      return Response.json({ success: true, employees });
    }

    // 🔹 SUPERVISOR SELF FLOW (token required)
    const auth = req.headers.get("authorization");
    if (!auth) {
      return Response.json({ success: false, employees: [] });
    }

    const token = auth.replace("Bearer ", "").trim();
    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return Response.json({ success: false, employees: [] });
    }

    const employees = await Employee.find({
      supervisorCode: decoded.code,
    }).lean();

    return Response.json({ success: true, employees });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

