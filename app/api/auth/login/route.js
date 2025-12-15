import dbConnect from "@/lib/mongodb";
import Admin from "@/models/Admin";
import ZoneAdmin from "@/models/ZoneAdmin";
import Supervisor from "@/models/Supervisor";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Zone from "@/models/Zone";
;

export async function POST(req) {
  await dbConnect();

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ success: false, message: "Email and password required" }),
        { status: 400 }
      );
    }

    let user = null;
    let role = null;
    let redirectPath = null;

    // 1️⃣ Super Admin
    user = await Admin.findOne({ email });
    if (user) {
      role = "SUPER_ADMIN";
      redirectPath = "/admin/dashboard";
    }

    // 2️⃣ Zone Admin
    if (!user) {
      user = await ZoneAdmin.findOne({ email, status: "ACTIVE" }).populate("assignedZones");
      if (user) {
        role = "ZONE_ADMIN";
        redirectPath = "/zone-admin/dashboard";
      }
    }

    // 3️⃣ Supervisor
    if (!user) {
      user = await Supervisor.findOne({ email, status: "ACTIVE" });
      if (user) {
        role = "SUPERVISOR";
        redirectPath = "/supervisor/dashboard";
      }
    }

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid credentials" }),
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid credentials" }),
        { status: 401 }
      );
    }

    const token = jwt.sign(
      { userId: user._id, role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return new Response(
      JSON.stringify({
        success: true,
        role,
        redirectPath,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role,
        },
      }),
      {
        status: 200,
        headers: {
          "Set-Cookie": `token=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax`,

          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Login error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Server error" }),
      { status: 500 }
    );
  }
}

