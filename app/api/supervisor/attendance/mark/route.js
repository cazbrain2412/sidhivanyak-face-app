import dbConnect from "@/lib/mongodb";
import Supervisor from "@/models/Supervisor";
import Attendance from "@/models/Attendance";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

function todayKeyIST() {
  const d = new Date();
  const ist = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  return ist.toISOString().slice(0, 10);
}

export async function POST(req) {
  await dbConnect();

  try {
    // ✅ FIX 1: headers() MUST be awaited
    const headerList = await headers();
    const auth = headerList.get("authorization");

    if (!auth || !auth.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = auth.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "SUPERVISOR") {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    const { action, location } = await req.json();

    const supervisor = await Supervisor.findById(decoded.userId).lean();
    if (!supervisor?.faceDescriptor) {
      return NextResponse.json(
        { success: false, message: "Face not enrolled" },
        { status: 400 }
      );
    }

    const date = todayKeyIST();
    const now = new Date();

    let record = await Attendance.findOne({
      role: "SUPERVISOR",
      supervisorId: supervisor._id,
      date,
    });

    // ---------------- PUNCH IN ----------------
    if (action === "in") {
      if (record?.punchIn) {
        return NextResponse.json(
          { success: false, message: "Already punched in" },
          { status: 400 }
        );
      }

      record = await Attendance.create({
        role: "SUPERVISOR",
        supervisorId: supervisor._id,
        supervisorName: supervisor.name,
        date,
        punchIn: now,
        status: "HALF",
        ...(location || {}),
      });

      return NextResponse.json({ success: true, record });
    }

    // ---------------- PUNCH OUT ----------------
    if (action === "out") {
      if (!record?.punchIn) {
        return NextResponse.json(
          { success: false, message: "Punch in first" },
          { status: 400 }
        );
      }

      if (record.punchOut) {
        return NextResponse.json(
          { success: false, message: "Already punched out" },
          { status: 400 }
        );
      }

      record.punchOut = now;
      record.status = "PRESENT";
      Object.assign(record, location || {});
      await record.save();

      return NextResponse.json({ success: true, record });
    }

    return NextResponse.json(
      { success: false, message: "Invalid action" },
      { status: 400 }
    );
  } catch (err) {
    console.error("SUPERVISOR ATTENDANCE ERROR:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Server error" },
      { status: 500 }
    );
  }
}

