/**
 * app/api/reports/export/route.js
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

    const q = {};
    if (fromDate && toDate) {
      q.date = { $gte: fromDate, $lte: toDate };
    }

    const docs = await Attendance.find(q).sort({ date: 1 }).lean();

    let csv =
      "Employee Name,Employee Code,Date,Punch In,Punch Out,Status,Location\n";

    for (const d of docs) {
      csv += [
        `"${d.employeeName || ""}"`,
        `"${d.employeeCode || ""}"`,
        `"${d.date}"`,
        `"${toIST(d.punchIn)}"`,
        `"${toIST(d.punchOut)}"`,
        `"${d.status || ""}"`,
        `"${d.locationName || ""}"`,
      ].join(",") + "\n";
    }

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition":
          "attachment; filename=attendance_report.csv",
      },
    });

  } catch (err) {
    console.error("report export error", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

