import dbConnect from "../../../../lib/mongodb";
import Employee from "../../../../models/Employee";
import jwt from "jsonwebtoken";

export async function GET(req) {
  await dbConnect();

  const url = new URL(req.url);
  const supervisorCodeFromQuery = url.searchParams.get("code");

  // ✅ ADMIN / SUPER ADMIN / ZONE ADMIN FLOW (NO TOKEN)
  if (supervisorCodeFromQuery) {
    const employees = await Employee.find({
      supervisorCode: supervisorCodeFromQuery,
    }).lean();

    return Response.json({ success: true, employees });
  }

  // ✅ SUPERVISOR SELF LOGIN FLOW (TOKEN REQUIRED)
  const auth = req.headers.get("authorization");
  if (!auth) {
    return Response.json({ success: false, employees: [] });
  }

  try {
    const token = auth.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const employees = await Employee.find({
      supervisorCode: decoded.code,
    }).lean();

    return Response.json({ success: true, employees });
  } catch (err) {
    return Response.json({ success: false, employees: [] });
  }
}

