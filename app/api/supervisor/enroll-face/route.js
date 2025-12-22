import dbConnect from "@/lib/mongodb";
import Supervisor from "@/models/Supervisor";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req) {
  await dbConnect();

  try {
    const auth = req.headers.get("authorization");
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const token = auth.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "SUPERVISOR") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const { samples } = await req.json();
    if (!Array.isArray(samples) || samples.length < 3) {
      return NextResponse.json({ success: false, message: "Invalid samples" }, { status: 400 });
    }

    // Average descriptor
    const avg = samples[0].map((_, i) =>
      samples.reduce((s, d) => s + (d[i] || 0), 0) / samples.length
    );

    await Supervisor.findByIdAndUpdate(decoded.userId, {
      faceDescriptor: avg,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

