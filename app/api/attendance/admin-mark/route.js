/**
 * ADMIN MANUAL ATTENDANCE MARK API
 * Used ONLY by Admin Attendance page
 * DOES NOT affect Face Attendance
 */

import dbConnect from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import Employee from "@/models/Employee";
import { NextResponse } from "next/server";

export async function POST(req) {
  await dbConnect();

  try {
    const {
      employeeCode,
      date,
      status,
      punchIn,
      punchOut,
      notes,
      location,
    } = await req.json();

    // 🔐 Basic validation
    if (!employeeCode || !date) {
      return NextResponse.json(
        { success: false, message: "employeeCode and date are required" },
        { status: 400 }
      );
    }

    const emp = await Employee.findOne({ code: employeeCode }).lean();
    if (!emp) {
      return NextResponse.json(
        { success: false, message: "Employee not found" },
        { status: 404 }
      );
    }

    const update = {
      employeeCode,
      employeeName: emp.name,
      date,
      status: status || "PRESENT",
      division: emp.division,
      zone: emp.zone,
      department: emp.department,
      notes: notes || "",
      ...(location || {}),
    };

    if (punchIn) update.punchIn = new Date(punchIn);
    if (punchOut) update.punchOut = new Date(punchOut);

    const record = await Attendance.findOneAndUpdate(
      { employeeCode, date },
      { $set: update },
      { upsert: true, new: true }
    );

    return NextResponse.json(
      { success: true, record },
      { status: 200 }
    );
  } catch (err) {
    console.error("ADMIN MARK ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

