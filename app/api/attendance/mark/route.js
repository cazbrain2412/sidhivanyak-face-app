/**
 * Face match + Punch IN / Punch OUT
 * Supports SINGLE_PUNCH & DOUBLE_PUNCH (division based)
 */

import dbConnect from "@/lib/mongodb";
import Employee from "@/models/Employee";
import Attendance from "@/models/Attendance";
import Division from "@/models/Division";
import { NextResponse } from "next/server";
import Supervisor from "@/models/Supervisor";
import SupervisorAttendance from "@/models/SupervisorAttendance";

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
    const { descriptor, action, location, mode } = await req.json();
    const isSupervisor = mode === "supervisor";

    if (!Array.isArray(descriptor) || descriptor.length < 10) {
      return NextResponse.json(
        { success: false, message: "Invalid face data" },
        { status: 400 }
      );
    }

    if (!["in", "out"].includes(action)) {
      return NextResponse.json(
        { success: false, message: "Invalid action" },
        { status: 400 }
      );
    }

    const people = isSupervisor
      ? await Supervisor.find({ faceDescriptor: { $ne: [] } }).lean()
      : await Employee.find({ faceDescriptor: { $ne: [] } }).lean();

    if (!people.length) {
      return NextResponse.json(
        { success: false, message: "No faces enrolled" },
        { status: 400 }
      );
    }

    // ---------- FACE MATCHING ----------
    let best = null;
    let bestDist = Infinity;

    for (const p of people) {
      if (!Array.isArray(p.faceDescriptor)) continue;
      const d = euclidean(descriptor, p.faceDescriptor);
      if (d < bestDist) {
        bestDist = d;
        best = p;
      }
    }

    if (!best) {
      return NextResponse.json(
        { success: false, message: "Face not matched" },
        { status: 400 }
      );
    }

    const now = new Date();
    const dateKey = now.toISOString().slice(0, 10);

    const existing = isSupervisor
      ? await SupervisorAttendance.findOne({
          supervisorId: best._id,
          date: dateKey,
        })
      : await Attendance.findOne({
          employeeCode: best.code,
          date: dateKey,
        });

    // ---------------- PUNCH IN ----------------
    if (action === "in") {
      if (existing?.punchIn) {
        return NextResponse.json(
          {
            success: false,
            message: "Already punched in",
            employee: { name: best.name, code: best.code },
          },
          { status: 400 }
        );
      }

      if (isSupervisor) {
        await SupervisorAttendance.create({
          supervisorId: best._id,
          supervisorName: best.name,
          date: dateKey,
          punchIn: now,
          status: "HALF",
          location,
        });
      } else {
        await Attendance.create({
          employeeCode: best.code,
          employeeName: best.name,
          date: dateKey,
          punchIn: now,
          status: "HALF",
          location,
        });
      }

      return NextResponse.json({ success: true }, { status: 200 });
    }

    // ---------------- PUNCH OUT ----------------
    if (action === "out") {
      if (!existing?.punchIn) {
        return NextResponse.json(
          {
            success: false,
            message: "Punch in not found",
            employee: { name: best.name, code: best.code },
          },
          { status: 400 }
        );
      }

      if (existing?.punchOut) {
        return NextResponse.json(
          {
            success: false,
            message: "Already punched out",
            employee: { name: best.name, code: best.code },
          },
          { status: 400 }
        );
      }

      await existing.updateOne({
        $set: { punchOut: now, status: "FULL" },
      });

      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json(
      { success: false, message: "Invalid action" },
      { status: 400 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}






   

   


     
 
   
             


 

     
    




  

    
