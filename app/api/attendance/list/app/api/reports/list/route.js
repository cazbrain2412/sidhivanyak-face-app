/**
 * app/api/reports/list/route.js
 */

import dbConnect from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import { NextResponse } from "next/server";

function toIST(date) {
  if (!date) return "";
  return new Date(date).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour12: true,
  });
}

export async function GET(req) {
  await dbConnect();

  try {
    const url = new URL(req.url);

    const fromDate = url.searchParams.get("fromDate");
    const toDate = url.searchParams.get("toDate");
    const employeeCode = url.searchParams.get("employeeCode");

    const q = {};

    if (fromDate && toDate) {
      q.date = { $gte: fromDate, $lte: toDate };
    }

    if (employeeCode) {
      q.employeeCode = employeeCode;
    }

    const docs = await Attendance.find(q).sort({ date: 1 }).lean();

    let totalPresent = 0;
    const employeeSet = new Set();

    const rows = docs.map(d => {
      if (d.status === "present") totalPresent++;
      employeeSet.add(d.employeeCode);

      return {
        employeeName: d.employeeName,
        employeeCode: d.employeeCode,
        date: d.date,
        punchIn: toIST(d.punchIn),
        punchOut: toIST(d.punchOut),
        status: d.status || "absent",
        location: d.locationName || "",
      };
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalEmployees: employeeSet.size,
        totalPresent,
      },
      rows,
    });

  } catch (err) {
    console.error("report list error", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

