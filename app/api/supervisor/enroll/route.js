import dbConnect from "@/lib/mongodb";
import Supervisor from "@/models/Supervisor";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function POST(req) {
  await dbConnect();

  try {
    const auth = headers().get("authorization");
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const token = auth.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "SUPERVISOR") {
      return NextResponse.json({ success: false }, { status: 403 });
    }

    const { descriptor } = await req.json();

    if (!Array.isArray(descriptor) || descriptor.length < 10) {
      return NextResponse.json({ success: false, message: "Invalid face data" }, { status: 400 });
    }

    await Supervisor.findByIdAndUpdate(decoded.userId, {
      faceDescriptor: descriptor,
      faceEnrolledAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("SUPERVISOR ENROLL ERROR", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

