import dbConnect from "@/lib/mongodb";
import ZoneAdmin from "@/models/ZoneAdmin";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    await dbConnect();

    const { email, password } = await req.json();

    const zoneAdmin = await ZoneAdmin.findOne({ email });

    if (!zoneAdmin) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid credentials" }),
        { status: 401 }
      );
    }

    if (zoneAdmin.status !== "ACTIVE") {
      return new Response(
        JSON.stringify({ success: false, message: "Account inactive" }),
        { status: 403 }
      );
    }

    const isMatch = await bcrypt.compare(password, zoneAdmin.password);

    if (!isMatch) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid credentials" }),
        { status: 401 }
      );
    }

    const token = jwt.sign(
      {
        userId: zoneAdmin._id,
        role: "ZONE_ADMIN",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const isProd = process.env.NODE_ENV === "production";

    return new Response(
      JSON.stringify({
        success: true,
        message: "Zone Admin login successful",
        redirectPath: "/zone-admin/dashboard",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": `token=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax${
            isProd ? "; Secure" : ""
          }`,
        },
      }
    );
  } catch (error) {
    console.error("Zone admin login error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Server error" }),
      { status: 500 }
    );
  }
}

