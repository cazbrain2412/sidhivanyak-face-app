/**
 * REPORTS – CALENDAR API (READ ONLY)
 * Month-wise, Employee-wise attendance calendar
 */

import dbConnect from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import Employee from "@/models/Employee";
import { NextResponse } from "next/server";

function getDaysOfMonth(year, month) {
  const days = [];
  const last = new Date(year, month, 0).getDate();

  for (let d = 1; d <= last; d++) {
    const date = new Date(Date.UTC(year, month - 1, d));

    days.push({
  day: d,
  date: date.toISOString().split("T")[0],
  weekday: date.toLocaleDateString("en-IN", {
    weekday: "short",
    timeZone: "Asia/Kolkata",
  }),
});

  }
  return days;
}

  await dbConnect();
export async function GET(req) {
  await dbConnect();
  const token =
    req.cookies.get("token")?.value ||
    req.headers.get("authorization")?.replace("Bearer ", "");

  let role = "SUPER_ADMIN";
  let allowedZones = [];
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      role = decoded.role;

      if (role === "ZONE_ADMIN") {
        const za = await ZoneAdmin.findById(decoded.userId).lean();
        allowedZones = za?.assignedZones || [];
      }
    } catch (e) {
      // ignore invalid token
    }
  }


  try {
    const url = new URL(req.url);

    const month = url.searchParams.get("month"); // YYYY-MM
    const zone = url.searchParams.get("zone");
    const division = url.searchParams.get("division");
    const supervisor = url.searchParams.get("supervisor");
    const employeeCode = url.searchParams.get("employee");

    if (!month) {
      return NextResponse.json(
        { success: false, message: "month is required" },
        { status: 400 }
      );
    }

    const [year, m] = month.split("-").map(Number);
    const days = getDaysOfMonth(year, m);

  /* -------- EMPLOYEE FILTER -------- */
const empQuery = {};

// 🔐 HARD RESTRICTION — ZONE ADMIN CAN NEVER BYPASS THIS
if (role === "ZONE_ADMIN") {
  if (!allowedZones.length) {
    return NextResponse.json({
      success: true,
      month,
      days,
      rows: [],
    });
  }
  empQuery.zone = { $in: allowedZones };
} else {
  // SUPER ADMIN FILTERS
  if (zone) empQuery.zone = zone;
}

if (division) empQuery.division = division;
if (supervisor) empQuery.supervisorCode = supervisor;

if (employeeCode) empQuery.code = employeeCode;

const employees = await Employee.find(empQuery).lean();
const empCodes = employees.map(e => e.code);


 
    
    

    /* -------- ATTENDANCE FETCH -------- */
    const startDate = days[0].date;
    const endDate = days[days.length - 1].date;

    const records = await Attendance.find({
      employeeCode: { $in: empCodes },
      date: { $gte: startDate, $lte: endDate },
    }).lean();

    /* -------- BUILD MAP -------- */
    const attMap = {};
    for (const r of records) {
      attMap[`${r.employeeCode}|${r.date}`] = r;
    }

    /* -------- BUILD RESPONSE -------- */
    const rows = employees.map(emp => {
      const attendance = {};
      let present = 0, absent = 0, half = 0, leave = 0;

      for (const d of days) {
        const key = `${emp.code}|${d.date}`;
        const a = attMap[key];

        let status = "A";
        if (a?.status) {
          const s = a.status.toUpperCase();
          if (["P", "PRESENT"].includes(s)) status = "P";
          else if (["H", "HALF"].includes(s)) status = "H";
          else if (["L", "LEAVE"].includes(s)) status = "L";
        }

        attendance[d.date] = status;

        if (status === "P") present++;
        else if (status === "H") half++;
        else if (status === "L") leave++;
        else absent++;
      }

      return {
        employee: {
          code: emp.code,
          name: emp.name,
          zone: emp.zone,
          division: emp.division,
          supervisor: emp.supervisor,
        },
        attendance,
        summary: {
          present,
          absent,
          half,
          leave,
          total: days.length,
        },
      };
    });

    return NextResponse.json({
      success: true,
      month,
      days,
      rows,
    });
  } catch (err) {
    console.error("REPORT CALENDAR ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

