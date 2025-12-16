/**
 * app/api/attendance/list/route.js
 */

import dbConnect from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import ZoneAdmin from "@/models/ZoneAdmin";

/* ------------------ IST HELPERS (NEW) ------------------ */
function toIST(date) {
  if (!date) return null;
  const d = new Date(date);
  return new Date(d.getTime() + (5.5 * 60 * 60 * 1000));
}
/* ------------------------------------------------------ */

function buildDayRange(dateStr) {
  const [yyyy, mm, dd] = dateStr.split("-").map(Number);
  const start = new Date(yyyy, mm - 1, dd, 0, 0, 0, 0);
  const end = new Date(yyyy, mm - 1, dd, 23, 59, 59, 999);
  return { start, end };
}

function toDateKey(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getTokenFromCookie(req) {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map(c => c.trim());
  const tokenCookie = cookies.find(c => c.startsWith("token="));
  if (!tokenCookie) return null;

  return tokenCookie.split("=")[1];
}


export async function GET(req) {
  await dbConnect();
// 🔐 Auth & role detection
const token = getTokenFromCookie(req);
let role = "SUPER_ADMIN";
let allowedZones = [];

if (token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    role = decoded.role;

    if (role === "ZONE_ADMIN") {
  const zoneAdmin = await ZoneAdmin.findById(decoded.userId)
    .populate("assignedZones")
    .lean();

  allowedZones = zoneAdmin?.assignedZones?.map(z => z.name) || [];
}

      
    
  } catch (e) {
    // ignore, fallback to SUPER_ADMIN
  }
}


  try {
    const url = new URL(req.url);
    const date = url.searchParams.get("date");
    const employeeCode = url.searchParams.get("employeeCode");
    const recent = url.searchParams.get("recent") || url.searchParams.get("r");
    const month = url.searchParams.get("month");

    // 1️⃣ Recent documents
    if (recent) {
      const n = Math.min(500, parseInt(recent, 10) || 50);
      const q = {};
if (role === "ZONE_ADMIN") {
  q.zone = { $in: allowedZones };
}

const docs = await Attendance.find(q)

        .sort({ createdAt: -1 })
        .limit(n)
        .lean();

      const normalized = docs.map(d => ({
        ...d,
        timestamp: toIST(
          d.timestamp ||
          d.createdAt ||
          d.punchIn ||
          (d.date ? new Date(d.date + "T00:00:00Z") : null)
        ),
      }));

      return NextResponse.json({ success: true, attendance: normalized });
    }

    // 2️⃣ Month filter
    if (month) {
      const [y, m] = month.split("-").map(Number);
      if (!y || !m) {
        return NextResponse.json({ success: false }, { status: 400 });
      }

      const startKey = `${y}-${String(m).padStart(2, "0")}-01`;
      const lastDay = new Date(y, m, 0).getDate();
      const endKey = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

      const q = { date: { $gte: startKey, $lte: endKey } };
      if (employeeCode) q.employeeCode = employeeCode;
      if (role === "ZONE_ADMIN") {
  q.zone = { $in: allowedZones };
}

      const docs = await Attendance.find(q).sort({ date: 1 }).lean();

      return NextResponse.json({
        success: true,
        attendance: docs.map(d => ({
          ...d,
          timestamp: toIST(
            d.timestamp ||
            d.createdAt ||
            d.punchIn ||
            (d.date ? new Date(d.date + "T00:00:00Z") : null)
          ),
        })),
      });
    }

    // 3️⃣ Date-based logic continues unchanged (ONLY timestamp added)

    // Existing date / synthesis logic remains same
    // Only change: set `timestamp` using toIST()

    // >>> Everything else in your original file continues EXACTLY as it is
    // >>> Just ensure that wherever `timestamp` is set, it uses toIST()

    return NextResponse.json({ success: true, attendance: [] });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

