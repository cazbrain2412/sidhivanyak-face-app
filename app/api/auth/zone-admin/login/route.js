import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import ZoneAdmin from "@/models/ZoneAdmin";

export async function POST(req) {
  await dbConnect();
  const { email, password } = await req.json();

  const user = await ZoneAdmin.findOne({ email, status: "ACTIVE" }).populate("assignedZones");
  if (!user) {
    return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
  }

  const token = jwt.sign(
    { userId: user._id, role: "ZONE_ADMIN" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  const res = NextResponse.json({
    success: true,
    redirectPath: "/zone-admin/dashboard",
  });

  // 🔥 IMPORTANT
  res.cookies.set("token", token, {
    httpOnly: true,
    path: "/",
  });

  return res;
}

