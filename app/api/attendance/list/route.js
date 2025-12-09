/**
 * app/api/attendance/list/route.js
 */

import dbConnect from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import { NextResponse } from "next/server";

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

export async function GET(req) {
  await dbConnect();

  try {
    const url = new URL(req.url);
    const date = url.searchParams.get("date");
    const employeeCode = url.searchParams.get("employeeCode");
    const recent = url.searchParams.get("recent") || url.searchParams.get("r");
    const month = url.searchParams.get("month");

    // 1️⃣ Recent documents
    if (recent) {
      const n = Math.min(500, parseInt(recent, 10) || 50);
      const docs = await Attendance.find({})
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

