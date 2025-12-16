import dbConnect from "@/lib/mongodb";
import ZoneAdmin from "@/models/ZoneAdmin";
import bcrypt from "bcryptjs";

// ❗ NOTHING ELSE HERE (NO cookies, NO decoded, NO logic)

export async function POST(req) {
  await dbConnect();

  try {
    // ===============================
    // DEMO MODE: bypass auth
    // ===============================
    const decoded = {
      role: "SUPER_ADMIN",
      id: "demo-super-admin",
    };

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
  // DEMO MODE: skip createdBy
});


    return Response.json({
      success: true,
      message: "Zone Admin created successfully",
      zoneAdminId: zoneAdmin._id,
    });
  } catch (err) {
    console.error("ZONE ADMIN CREATE ERROR:", err);
    return Response.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
      

