import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Admin from "@/models/Admin";
import ZoneAdmin from "@/models/ZoneAdmin";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    await dbConnect();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password required" },
        { status: 400 }
      );
    }

    // 1️⃣ Try SUPER ADMIN login
    const admin = await Admin.findOne({ email }).lean();
    if (admin) {
      const ok = await bcrypt.compare(password, admin.password);
      if (!ok) {
        return NextResponse.json(
          { success: false, message: "Invalid credentials" },
          { status: 401 }
        );
      }

      const token = jwt.sign(
        { id: admin._id, role: "SUPER_ADMIN" },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      const res = NextResponse.json({
        success: true,
        role: "SUPER_ADMIN",
        redirect: "/admin/dashboard",
      });

      res.cookies.set("token", token, {
        httpOnly: true,
        path: "/",
      });

      return res;
    }

    // 2️⃣ Try ZONE ADMIN login
    const zoneAdmin = await ZoneAdmin.findOne({ email }).lean();
    if (zoneAdmin) {
      const ok = await bcrypt.compare(password, zoneAdmin.password);
      if (!ok) {
        return NextResponse.json(
          { success: false, message: "Invalid credentials" },
          { status: 401 }
        );
      }

      const token = jwt.sign(
        { id: zoneAdmin._id, role: "ZONE_ADMIN" },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      const res = NextResponse.json({
        success: true,
        role: "ZONE_ADMIN",
        redirect: "/zone-admin/dashboard",
      });

      res.cookies.set("token", token, {
        httpOnly: true,
        path: "/",
      });

      return res;
    }

    // 3️⃣ No user found
    return NextResponse.json(
      { success: false, message: "Invalid credentials" },
      { status: 401 }
    );

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

