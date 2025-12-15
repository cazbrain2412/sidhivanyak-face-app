import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import Supervisor from "@/models/Supervisor";
import ZoneAdmin from "@/models/ZoneAdmin";

export async function POST(req) {
  await dbConnect();

  // ✅ READ TOKEN FROM COOKIE (NOT HEADER)
  const token = req.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Invalid token" },
      { status: 401 }
    );
  }

  if (decoded.role !== "ZONE_ADMIN") {
    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status: 403 }
    );
  }

  const zoneAdmin = await ZoneAdmin.findById(decoded.userId);
  if (!zoneAdmin) {
    return NextResponse.json(
      { success: false, message: "Zone Admin not found" },
      { status: 404 }
    );
  }

  const body = await req.json();
  const hashedPassword = await bcrypt.hash(body.password, 10);

  const supervisor = await Supervisor.create({
    ...body,
    password: hashedPassword,
    zone: zoneAdmin.assignedZones[0], // auto-assign zone
    createdBy: zoneAdmin._id,
  });

  return NextResponse.json({
    success: true,
    message: "Supervisor created successfully",
    supervisorId: supervisor._id,
  });
}

