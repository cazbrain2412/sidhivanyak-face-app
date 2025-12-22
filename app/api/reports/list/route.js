/**
 * REPORTS – Attendance list API
 * Used ONLY by Reports page (read-only)
 */

import dbConnect from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import { NextResponse } from "next/server";

export async function GET(req) {
  await dbConnect();

  try {
    const url = new URL(req.url);

    const month = url.searchParams.get("month"); // YYYY-MM
    const zone = url.searchParams.get("zone");
    const division = url.searchParams.get("division");
    const supervisor = url.searchParams.get("supervisor");

    if (!month) {
      return NextResponse.json(
        { success: false, message: "month is required" },
        { status: 400 }
      );
    }

    const [year, m] = month.split("-").map(Number);

    const startDate = `${year}-${String(m).padStart(2, "0")}-01`;
    const lastDay = new Date(year, m, 0).getDate();
    const endDate = `${year}-${String(m).padStart(2, "0")}-${lastDay}`;

    const query = {
      date: { $gte: startDate, $lte: endDate },
    };

    if (zone) query.zone = zone;
    if (division) query.division = division;
    if (supervisor) query.supervisor = supervisor;

    const attendance = await Attendance.find(query).lean();

    return NextResponse.json({
      success: true,
      attendance,
    });
  } catch (err) {
    console.error("REPORT LIST ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

