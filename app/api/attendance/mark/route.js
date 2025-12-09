/**
 * app/api/attendance/mark/route.js
 *
 * Face match + Punch IN / Punch OUT with 2-hour logic
 * - Uses server-side descriptor matching
 * - One record per employee per day (dateKey = YYYY-MM-DD)
 * - Status rules:
 *    - No record  -> Absent (handled by UI as A)
 *    - Punch IN only  -> HALF
 *    - Punch IN + Punch OUT, workHours >= 2 -> PRESENT
 *    - Punch IN + Punch OUT, workHours < 2  -> HALF
 *    - Punch OUT only (no IN) -> HALF
 */

import dbConnect from "@/lib/mongodb";
import Employee from "@/models/Employee";
import Attendance from "@/models/Attendance";
import { NextResponse } from "next/server";

function euclidean(a, b) {
  let s = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const d = (Number(a[i]) || 0) - (Number(b[i]) || 0);
    s += d * d;
  }
  return Math.sqrt(s);
}

// helper: build date key YYYY-MM-DD in server local time
function buildDateKey(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function POST(req) {
  await dbConnect();
  try {
    const body = await req.json();
    const { descriptor, action, location } = body; // <-- location added

    if (!Array.isArray(descriptor) || descriptor.length < 10) {
      return NextResponse.json(
        { success: false, message: "Descriptor required for verification" },
        { status: 400 }
      );
    }

    if (!action || (action !== "in" && action !== "out")) {
      return NextResponse.json(
        { success: false, message: "Invalid action. Use 'in' or 'out'." },
        { status: 400 }
      );
    }

    // 1) Load all enrolled employees (with faceDescriptor)
    const employees = await Employee.find({
      faceDescriptor: { $exists: true, $ne: [] },
    }).lean();

    if (!employees || employees.length === 0) {
      return NextResponse.json(
        { success: false, matched: false, message: "No enrolled faces on server" },
        { status: 400 }
      );
    }

    // 2) Find best match
    let best = null;
    let bestDist = Infinity;
    for (const emp of employees) {
      if (!emp.faceDescriptor || emp.faceDescriptor.length === 0) continue;
      const dist = euclidean(descriptor, emp.faceDescriptor);
      if (dist < bestDist) {
        bestDist = dist;
        best = emp;
      }
    }

    const THRESH = 0.55;
    if (!best || bestDist > THRESH) {
      return NextResponse.json(
        { success: false, matched: false, message: "No face match", bestDist },
        { status: 200 }
      );
    }

    const now = new Date();
    const dateKey = buildDateKey(now);
    const matchedCode = best.code;

    // Try to find an existing record for this employee + day
    let existing = await Attendance.findOne({
      employeeCode: matchedCode,
      date: dateKey,
    }).lean();

    // small helper: attach location fields if provided
    function buildLocationSet() {
      if (!location || typeof location !== "object") return {};
      const lat = Number(location.lat);
      const lng = Number(location.lng);
      const accuracy = location.accuracy != null ? Number(location.accuracy) : null;
      const set = {};
      if (!Number.isNaN(lat)) set.locationLat = lat;
      if (!Number.isNaN(lng)) set.locationLng = lng;
      if (accuracy != null && !Number.isNaN(accuracy)) set.locationAccuracy = accuracy;
      return set;
    }

    // little helpers to check fields even if schema names differ
    const hasInFlag = (rec) =>
      !!(rec?.punchIn || rec?.in || rec?.punch?.in || rec?.punchInTime);
    const hasOutFlag = (rec) =>
      !!(rec?.punchOut || rec?.out || rec?.punch?.out || rec?.punchOutTime);

    // ---------- ACTION: PUNCH IN ----------
    if (action === "in") {
      if (!existing) {
        // first punch of the day -> create record
        const toCreate = {
          employeeCode: matchedCode,
          employeeName: best.name || best.code,
          date: dateKey,
          punchIn: now,
          status: "HALF", // until we get OUT with >=2 hours
          ...buildLocationSet(),
        };
        if (best.zone) toCreate.zone = best.zone;
        if (best.division) toCreate.division = best.division;
        if (best.department) toCreate.department = best.department;
        if (best.supervisorCode) toCreate.supervisorCode = best.supervisorCode;

        const created = await Attendance.create(toCreate);
        return NextResponse.json(
          {
            success: true,
            matched: true,
            employee: best,
            record: created,
            inToday: true,
            outToday: hasOutFlag(created),
            nextAction: "out",
            bestDist,
          },
          { status: 200 }
        );
      } else {
        // already have a record today
        if (hasInFlag(existing)) {
          // we already punched in once -> do not create second IN
          return NextResponse.json(
            {
              success: false,
              matched: true,
              message: "Punch IN already exists for today",
              inToday: true,
              outToday: hasOutFlag(existing),
              bestDist,
            },
            { status: 400 }
          );
        }

        // set punchIn on existing doc
        const updated = await Attendance.findByIdAndUpdate(
          existing._id,
          {
            $set: {
              punchIn: now,
              status: "HALF", // until OUT decides full/half
              ...buildLocationSet(),
            },
          },
          { new: true }
        ).lean();

        return NextResponse.json(
          {
            success: true,
            matched: true,
            employee: best,
            record: updated,
            inToday: true,
            outToday: hasOutFlag(updated),
            nextAction: "out",
            bestDist,
          },
          { status: 200 }
        );
      }
    }

    // ---------- ACTION: PUNCH OUT ----------
    // At this point action === "out"
    // Re-fetch in case we changed above
    if (!existing) {
      // No record at all today → create HALF-DAY with OUT only
      const toCreate = {
        employeeCode: matchedCode,
        employeeName: best.name || best.code,
        date: dateKey,
        punchOut: now,
        status: "HALF",
        ...buildLocationSet(),
      };
      if (best.zone) toCreate.zone = best.zone;
      if (best.division) toCreate.division = best.division;
      if (best.department) toCreate.department = best.department;
      if (best.supervisorCode) toCreate.supervisorCode = best.supervisorCode;

      const created = await Attendance.create(toCreate);
      return NextResponse.json(
        {
          success: true,
          matched: true,
          employee: best,
          record: created,
          inToday: false,
          outToday: true,
          workHours: 0,
          bestDist,
        },
        { status: 200 }
      );
    }

    const hadIn = hasInFlag(existing);
    const hadOut = hasOutFlag(existing);

    if (hadOut) {
      // already punched out once
      return NextResponse.json(
        {
          success: false,
          matched: true,
          message: "Punch OUT already recorded today",
          inToday: hadIn,
          outToday: true,
          bestDist,
        },
        { status: 400 }
      );
    }

    // compute hours between IN and OUT (if IN exists)
    let workHours = 0;
    let statusValue = "HALF";

    if (hadIn) {
      const inTime =
        existing.punchIn ||
        existing.in ||
        existing.punch?.in ||
        existing.punchInTime;
      const diffMs = now.getTime() - new Date(inTime).getTime();
      workHours = diffMs / (1000 * 60 * 60);
      statusValue = workHours >= 2 ? "PRESENT" : "HALF";
    } else {
      // OUT without IN -> still HALF
      statusValue = "HALF";
    }

    const updatedOut = await Attendance.findByIdAndUpdate(
      existing._id,
      {
        $set: {
          punchOut: now,
          status: statusValue,
          ...buildLocationSet(),
        },
      },
      { new: true }
    ).lean();

    return NextResponse.json(
      {
        success: true,
        matched: true,
        employee: best,
        record: updatedOut,
        inToday: hadIn,
        outToday: true,
        workHours,
        bestDist,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("attendance mark error", err);
    return NextResponse.json(
      { success: false, message: "Server error", error: String(err) },
      { status: 500 }
    );
  }
}

