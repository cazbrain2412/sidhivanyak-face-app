import dbConnect from "@/lib/mongodb";
import ZoneAdmin from "@/models/ZoneAdmin";
import Admin from "@/models/Admin";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req) {
  await dbConnect();

  try {
    // 🔐 Read token from cookie
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Only SUPER ADMIN can create Zone Admin
    if (decoded.role !== "SUPER_ADMIN") {
      return Response.json({ success: false, message: "Access denied" }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, mobile, assignedZones } = body;

    if (!name || !email || !password || !mobile || !assignedZones?.length) {
      return Response.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    const exists = await ZoneAdmin.findOne({ email });
    if (exists) {
      return Response.json(
        { success: false, message: "Zone Admin already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const zoneAdmin = await ZoneAdmin.create({
      name,
      email,
      password: hashedPassword,
      mobile,
      assignedZones,
      createdBy: decoded.id,
    });

    return Response.json({
      success: true,
      message: "Zone Admin created successfully",
      zoneAdminId: zoneAdmin._id,
    });

  } catch (err) {
    console.error(err);
    return Response.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

