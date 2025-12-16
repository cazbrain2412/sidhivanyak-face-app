import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import Admin from "@/models/Admin";
import ZoneAdmin from "@/models/ZoneAdmin";
import Supervisor from "@/models/Supervisor";
import bcrypt from "bcryptjs";
export async function POST(req: Request) {
  try {
    await dbConnect();


    const { email, password } = await req.json();

    let user: any = await Admin.findOne({ email });
    if (!user) user = await ZoneAdmin.findOne({ email });
    if (!user) user = await Supervisor.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // ⚠️ Adjust password check if you use hashing

let isPasswordValid = false;

// Case 1: bcrypt hashed password
if (user.password.startsWith("$2")) {
  isPasswordValid = await bcrypt.compare(password, user.password);
}
// Case 2: plain text password (old data / demo)
else {
  isPasswordValid = user.password === password;
}

if (!isPasswordValid) {
  return NextResponse.json(
    { message: "Invalid credentials" },
    { status: 401 }
  );
}


    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    const redirectPath =
      user.role === "SUPER_ADMIN"
        ? "/admin/dashboard"
        : user.role === "ZONE_ADMIN"
        ? "/zone-admin/dashboard"
        : user.role === "SUPERVISOR"
        ? "/supervisor/dashboard"
        : "/login";

    const res = NextResponse.json({
      success: true,
      role: user.role,
      redirectPath,
    });

    res.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}

