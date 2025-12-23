import dbConnect from "@/lib/mongodb";
import SupervisorAttendance from "@/models/SupervisorAttendance";
import Supervisor from "@/models/Supervisor";
import ZoneAdmin from "@/models/ZoneAdmin";
import jwt from "jsonwebtoken";
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
    } catch {}
  }

  try {
    const url = new URL(req.url);
    const month = url.searchParams.get("month");
    const zone = url.searchParams.get("zone");
    const supervisorCode = url.searchParams.get("supervisor");

    if (!month) {
      return NextResponse.json(
        { success: false, message: "month is required" },
        { status: 400 }
      );
    }

    const [year, m] = month.split("-").map(Number);
    const days = getDaysOfMonth(year, m);

    // ---------- SUPERVISOR FILTER ----------
    const supQuery = {};

    if (role === "ZONE_ADMIN") {
      if (!allowedZones.length) {
        return NextResponse.json({
          success: true,
          month,
          days,
          rows: [],
        });
      }
      supQuery.zone = { $in: allowedZones };
    } else if (zone) {
      supQuery.zone = zone;
    }

    if (supervisorCode) supQuery.code = supervisorCode;

    const supervisors = await Supervisor.find(supQuery).lean();
    const supCodes = supervisors.map(s => s.code);

    const fromDate = url.searchParams.get("fromDate");
    const toDate = url.searchParams.get("toDate");

    const startDate = fromDate || days[0].date;
    const endDate = toDate || days[days.length - 1].date;


    const records = await SupervisorAttendance.find({
      supervisorCode: { $in: supCodes },
      date: { $gte: startDate, $lte: endDate },
    }).lean();

    const map = {};
    for (const r of records) {
      map[`${r.supervisorCode}|${r.date}`] = r;
    }

    const rows = supervisors.map(sup => {
      let present = 0, absent = 0, half = 0;

      const attendance = {};
      for (const d of days) {
        const key = `${sup.code}|${d.date}`;
        const r = map[key];

        let status = "A";
        if (r?.status === "P") status = "P";
        else if (r?.status === "H") status = "H";

        attendance[d.date] = status;
        if (status === "P") present++;
        else if (status === "H") half++;
        else absent++;
      }

      return {
        supervisor: {
          code: sup.code,
          name: sup.name,
          zone: sup.zone,
          division: sup.division,
        },
        attendance,
        summary: { present, half, absent, total: days.length },
      };
    });

    return NextResponse.json({
      success: true,
      month,
      days,
      rows,
    });
  } catch (err) {
    console.error("SUPERVISOR CALENDAR ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

