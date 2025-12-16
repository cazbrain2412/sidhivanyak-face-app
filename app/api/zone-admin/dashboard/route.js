import dbConnect from "@/lib/mongodb";
import jwt from "jsonwebtoken";

import ZoneAdmin from "@/models/ZoneAdmin";
import Employee from "@/models/Employee";
import Division from "@/models/Division";
import Supervisor from "@/models/Supervisor";
import Attendance from "@/models/Attendance";

// 🔐 token reader (same safe helper you used)
function getTokenFromCookie(req) {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map(c => c.trim());
  const t = cookies.find(c => c.startsWith("token="));
  return t ? t.split("=")[1] : null;
}

// helper: today YYYY-MM-DD
function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

export async function GET(req) {
  try {
    await dbConnect();

    const token = getTokenFromCookie(req);
    if (!token) {
      return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "ZONE_ADMIN") {
      return new Response(JSON.stringify({ success: false, message: "Forbidden" }), { status: 403 });
    }

    const zoneAdmin = await ZoneAdmin.findById(decoded.userId).lean();
    const allowedZones = (zoneAdmin?.assignedZones || []).map(z => String(z));

    // --- COUNTS ---
    const totalEmployees = await Employee.countDocuments({
      zone: { $in: allowedZones }
    });

    const totalDivisions = await Division.countDocuments({
      zoneId: { $in: allowedZones }
    });

    const totalSupervisors = await Supervisor.countDocuments({
      zone: { $in: allowedZones }
    });

    // --- TODAY ATTENDANCE ---
    const today = todayKey();

    const present = await Attendance.countDocuments({
      date: today,
      zone: { $in: allowedZones },
      status: "PRESENT"
    });

    const half = await Attendance.countDocuments({
      date: today,
      zone: { $in: allowedZones },
      status: "HALF"
    });

    const totalMarked = present + half;
    const absent = Math.max(totalEmployees - totalMarked, 0);

    // --- LATEST ATTENDANCE ---
    const latestAttendance = await Attendance.find({
      zone: { $in: allowedZones }
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          totalEmployees,
          totalDivisions,
          totalSupervisors,
          present,
          half,
          absent
        },
        latestAttendance
      }),
      { status: 200 }
    );

  } catch (err) {
    console.error("zone-admin dashboard error:", err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), { status: 500 });
  }
}

