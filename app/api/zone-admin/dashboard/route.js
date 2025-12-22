import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import dbConnect from "@/lib/mongodb";
import ZoneAdmin from "@/models/ZoneAdmin";
import Employee from "@/models/Employee";
import Supervisor from "@/models/Supervisor";
import Attendance from "@/models/Attendance";

/**
 * Extract JWT safely from request
 */
function getTokenFromRequest(req) {
  // 1️⃣ Authorization header
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "");
  }

  // 2️⃣ Cookie fallback
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map(c => c.trim());
  const tokenCookie = cookies.find(c => c.startsWith("token="));
  if (!tokenCookie) return null;

  return tokenCookie.split("=")[1];
}

export async function GET(req) {
  try {
    await dbConnect();

    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "ZONE_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const zoneAdmin = await ZoneAdmin.findById(decoded.userId).lean();
    if (!zoneAdmin) {
      return NextResponse.json({ error: "Zone admin not found" }, { status: 404 });
    }

    const assignedZones = zoneAdmin.assignedZones || [];

    // 1️⃣ Zones assigned
    const zones = assignedZones.length;

    // 2️⃣ Employees count
    const employees = await Employee.countDocuments({
      zone: { $in: assignedZones },
    });

    // 3️⃣ Supervisors count
    const supervisors = await Supervisor.countDocuments({
      zone: { $in: assignedZones },
    });

    // 4️⃣ Latest attendance marks
    const latestAttendance = await Attendance.find({
      zone: { $in: assignedZones },
    })
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean();

    return NextResponse.json({
      success: true,
      zones,
      employees,
      supervisors,
      latestAttendance,
    });
  } catch (err) {
    console.error("ZONE ADMIN DASHBOARD ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

