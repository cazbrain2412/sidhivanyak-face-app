// app/api/employees/create-secure/route.js
import dbConnect from "../../../../lib/mongodb";
import Employee from "../../../../models/Employee";
import Supervisor from "../../../../models/Supervisor";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret123";

export async function POST(req) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth) {
      return new Response(JSON.stringify({ success: false, error: "Missing Authorization header" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const token = auth.replace("Bearer ", "").trim();
    let decoded = null;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // decoded contains: code, name, zone, division
    const supervisorCode = decoded.code;
    const supervisorZone = decoded.zone;
    const supervisorDivision = decoded.division;

    const body = await req.json();
    const {
      code,
      name,
      email,
      mobile,
      aadhar,
      pfNumber,
      esicNumber,
      bankAccount,
      ifsc,
      address,
      department,
      category,
    } = body || {};

    if (!code || !name) {
      return new Response(JSON.stringify({ success: false, error: "Missing required fields (code, name)" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await dbConnect();

    // prevent duplicate employee code
    const existing = await Employee.findOne({ code }).lean();
    if (existing) {
      return new Response(JSON.stringify({ success: false, error: "Employee code already exists" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create employee under supervisor’s zone/division
    const emp = await Employee.create({
      code,
      name,
      email,
      mobile,
      aadhar,
      pfNumber,
      esicNumber,
      bankAccount,
      ifsc,
      address,
      department,
      category,
      zone: supervisorZone,
      division: supervisorDivision,
      supervisorCode,
      faceDescriptor: [],
    });

    return new Response(JSON.stringify({ success: true, employee: emp }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("employee create secure error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message || String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

