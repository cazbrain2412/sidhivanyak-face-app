/**
 * Face match + Punch IN / Punch OUT
 * Supports SINGLE_PUNCH & DOUBLE_PUNCH (division based)
 */

import dbConnect from "@/lib/mongodb";
import Employee from "@/models/Employee";
import Attendance from "@/models/Attendance";
import Division from "@/models/Division";
import { NextResponse } from "next/server";

function euclidean(a, b) {
  let s = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const d = (Number(a[i]) || 0) - (Number(b[i]) || 0);
    s += d * d;
  }
  return Math.sqrt(s);
}

function buildDateKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export async function POST(req) {
  await dbConnect();
  try {
    const { descriptor, action, location } = await req.json();

    if (!Array.isArray(descriptor) || descriptor.length < 10) {
      return NextResponse.json({ success: false, message: "Invalid face data" }, { status: 400 });
    }

    if (!["in", "out"].includes(action)) {
      return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
    }

    const employees = await Employee.find({ faceDescriptor: { $ne: [] } }).lean();
    if (!employees.length) {
      return NextResponse.json({ success: false, message: "No faces enrolled" }, { status: 400 });
    }

    let best = null, bestDist = Infinity;
    for (const e of employees) {
      const d = euclidean(descriptor, e.faceDescriptor);
      if (d < bestDist) {
        bestDist = d;
        best = e;
      }
    }

    if (!best || bestDist > 0.55) {
      return NextResponse.json({ success: false, matched: false }, { status: 200 });
    }

    const now = new Date();
    const dateKey = buildDateKey(now);

    let attendanceType = "DOUBLE_PUNCH";
    let minHoursForPresent = 2;

    if (best.division) {
      const div = await Division.findOne({ name: best.division }).lean();
      if (div) {
        attendanceType = div.attendanceType || attendanceType;
        minHoursForPresent = div.minHoursForPresent ?? minHoursForPresent;
      }
    }

    const existing = await Attendance.findOne({
      employeeCode: best.code,
      date: dateKey,
    });

    // ---------------- PUNCH IN ----------------
    if (action === "in") {
      if (existing?.punchIn) {
        return NextResponse.json({ success: false, message: "Already punched in" }, { status: 400 });
      }

      const record = existing
        ? await Attendance.findByIdAndUpdate(
            existing._id,
            { $set: { punchIn: now, status: "HALF" } },
            { new: true }
          )
        : await Attendance.create({
            employeeCode: best.code,
            employeeName: best.name,
            date: dateKey,
            punchIn: now,
            status: "HALF",
            division: best.division,
            zone: best.zone,
          });

      return NextResponse.json({ success: true, record }, { status: 200 });
    }

    // ---------------- PUNCH OUT ----------------
    if (!existing?.punchIn) {
      return NextResponse.json({ success: false, message: "Punch IN required" }, { status: 400 });
    }

    const diffMs = now - new Date(existing.punchIn);
    const workHours = diffMs / (1000 * 60 * 60);

    let status =
      attendanceType === "SINGLE_PUNCH"
        ? "PRESENT"
        : workHours >= minHoursForPresent
        ? "PRESENT"
        : "HALF";

    const updated = await Attendance.findByIdAndUpdate(
      existing._id,
      {
        $set: {
          punchOut: now,
          status,
          ...(location || {}),
        },
      },
      { new: true }
    );

    return NextResponse.json(
      { success: true, record: updated, workHours },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
