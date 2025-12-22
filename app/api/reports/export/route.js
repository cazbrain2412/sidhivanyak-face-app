import dbConnect from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import Employee from "@/models/Employee";
import { NextResponse } from "next/server";

function csvEscape(v = "") {
  return `"${String(v).replace(/"/g, '""')}"`;
}

export async function GET(req) {
  await dbConnect();

  const { searchParams } = new URL(req.url);

  const month = searchParams.get("month"); // YYYY-MM
  const zone = searchParams.get("zone");
  const division = searchParams.get("division");
  const supervisor = searchParams.get("supervisor");
  const fromDate = searchParams.get("fromDate");
  const toDate = searchParams.get("toDate");

  if (!month && !fromDate) {
    return NextResponse.json({ error: "Month or date range required" }, { status: 400 });
  }

  // ---------------- DATE RANGE ----------------
  let start, end;

  if (fromDate && toDate) {
    start = new Date(fromDate);
    end = new Date(toDate);
  } else {
    const [y, m] = month.split("-").map(Number);
    start = new Date(y, m - 1, 1);
    end = new Date(y, m, 0);
  }

  // ---------------- EMPLOYEE FILTER ----------------
  const empQuery = {};
  if (zone) empQuery.zone = zone;
  if (division) empQuery.division = division;
  if (supervisor) empQuery.supervisorCode = supervisor;

  const employees = await Employee.find(empQuery).lean();
  const empCodes = employees.map(e => e.code);

  // ---------------- ATTENDANCE ----------------
  const records = await Attendance.find({
    employeeCode: { $in: empCodes },
    date: {
      $gte: start.toISOString().slice(0, 10),
      $lte: end.toISOString().slice(0, 10),
    },
  }).lean();

  // ---------------- BUILD MAP ----------------
  const map = {};
  for (const r of records) {
    if (!map[r.employeeCode]) map[r.employeeCode] = {};
    map[r.employeeCode][r.date] = r.status?.[0]?.toUpperCase() || "A";
  }

  // ---------------- CSV HEADER ----------------
  const dates = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10));
  }

  let csv = [];
  csv.push([
    "Employee Code",
    "Employee Name",
    ...dates,
    "Present",
    "Absent",
    "Half",
    "Leave",
    "Total",
  ].map(csvEscape).join(","));

  // ---------------- CSV ROWS ----------------
  for (const e of employees) {
    let p = 0, a = 0, h = 0, l = 0;

    const row = dates.map(date => {
      const s = map[e.code]?.[date] || "A";
      if (s === "P") p++;
      else if (s === "H") h++;
      else if (s === "L") l++;
      else a++;
      return s;
    });

    csv.push([
      e.code,
      e.name,
      ...row,
      p,
      a,
      h,
      l,
      p + a + h + l,
    ].map(csvEscape).join(","));
  }

  return new NextResponse(csv.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="attendance-report.csv"`,
    },
  });
}

