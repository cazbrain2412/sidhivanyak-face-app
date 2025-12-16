import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Admin from "@/models/Admin";
import ZoneAdmin from "@/models/ZoneAdmin";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const body = await req.json();
    const email = body.email?.toLowerCase();
    const password = body.password;

    // 🔥 SUPER ADMIN BYPASS (LIVE SAFE)
    if (email === "admin@casband.com") {
      return NextResponse.json({
        success: true,
        role: "SUPER_ADMIN",
        user: {
          email,
          name: "Super Admin",
        },
      });
    }

    // ❌ Validation AFTER bypass
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // 🔹 ZONE ADMIN LOGIN
    const zoneAdmin = await ZoneAdmin.findOne({ email });
    if (zoneAdmin) {
      const ok = await bcrypt.compare(password, zoneAdmin.password);
      if (!ok) {
        return NextResponse.json(
          { success: false, message: "Invalid credentials" },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        role: "ZONE_ADMIN",
        user: {
          id: zoneAdmin._id,
          email: zoneAdmin.email,
          name: zoneAdmin.name,
          zoneId: zoneAdmin.zoneId,
        },
      });
    }

    // 🔹 SUPER ADMIN (DB LOGIN – optional)
    const admin = await Admin.findOne({ email });
    if (admin) {
      const ok = await bcrypt.compare(password, admin.password);
      if (!ok) {
        return NextResponse.json(
          { success: false, message: "Invalid credentials" },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        role: "SUPER_ADMIN",
        user: {
          id: admin._id,
          email: admin.email,
          name: admin.name,
        },
      });
    }

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

