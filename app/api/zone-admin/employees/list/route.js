import dbConnect from "@/lib/mongodb";
import Employee from "@/models/Employee";
import Zone from "@/models/Zone";
import ZoneAdmin from "@/models/ZoneAdmin";
import jwt from "jsonwebtoken";

function getTokenFromReq(req) {
  const cookie = req.headers.get("cookie");
  if (!cookie) return null;

  const match = cookie.match(/token=([^;]+)/);
  return match ? match[1] : null;
}

export async function GET(req) {
  try {
    await dbConnect();

    // 🔐 Read token safely
    const token = getTokenFromReq(req);
    if (!token) {
      return Response.json({ success: false }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "ZONE_ADMIN") {
      return Response.json({ success: false }, { status: 403 });
    }

    // 1️⃣ Get Zone Admin
    const zoneAdmin = await ZoneAdmin.findById(decoded.userId)
      .select("assignedZones")
      .lean();

    if (!zoneAdmin || !zoneAdmin.assignedZones.length) {
      return Response.json({ success: true, employees: [] });
    }

    // 2️⃣ Convert zone IDs → zone names
    const zones = await Zone.find({
      _id: { $in: zoneAdmin.assignedZones },
    })
      .select("name")
      .lean();

    const zoneNames = zones.map(z => z.name);

    // 3️⃣ Fetch employees by zone name
    const employees = await Employee.find({
      zone: { $in: zoneNames },
    })
      .sort({ createdAt: -1 })
      .lean();

    return Response.json({ success: true, employees });

  } catch (err) {
    console.error("zone admin employees list error:", err);
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

