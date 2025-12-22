import dbConnect from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import Employee from "@/models/Employee";
import { NextResponse } from "next/server";

export async function GET(req) {
  await dbConnect();

  try {
    const url = new URL(req.url);

    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const month = url.searchParams.get("month");
    const zone = url.searchParams.get("zone");
    const division = url.searchParams.get("division");
    const supervisor = url.searchParams.get("supervisor");
    const q = url.searchParams.get("q");

    let startDate, endDate;

    if (from && to) {
      startDate = from;
      endDate = to;
    } else if (month) {
      const [y, m] = month.split("-").map(Number);
      startDate = `${y}-${String(m).padStart(2, "0")}-01`;
      endDate = `${y}-${String(m).padStart(2, "0")}-${new Date(y, m, 0).getDate()}`;
    } else {
      return NextResponse.json({ success: false, message: "Date filter required" }, { status: 400 });
    }

    const empQuery = {};
    if (zone) empQuery.zone = zone;
    if (division) empQuery.division = division;
    if (supervisor) empQuery.supervisor = supervisor;
    if (q) empQuery.$or = [
      { name: { $regex: q, $options: "i" } },
      { code: { $regex: q, $options: "i" } },
    ];

    const employees = await Employee.find(empQuery).lean();
    const empCodes = employees.map(e => e.code);

    const records = await Attendance.find({
      employeeCode: { $in: empCodes },
      date: { $gte: startDate, $lte: endDate },
    }).lean();

    const map = {};
    for (const e of employees) {
      map[e.code] = {
        employee: e,
        present: 0,
        absent: 0,
        half: 0,
        leave: 0,
        total: 0,
      };
    }

    for (const r of records) {
      const s = map[r.employeeCode];
      if (!s) continue;

      s.total++;

      const st = (r.status || "").toUpperCase();
      if (st === "P" || st === "PRESENT") s.present++;
      else if (st === "HALF" || st === "H") s.half++;
      else if (st === "LEAVE" || st === "L") s.leave++;
      else s.absent++;
    }

    return NextResponse.json({
      success: true,
      range: { startDate, endDate },
      rows: Object.values(map),
    });
  } catch (err) {
    console.error("REPORT SUMMARY ERROR", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

