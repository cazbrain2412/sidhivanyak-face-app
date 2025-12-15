import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import ZoneAdmin from "@/models/ZoneAdmin";

export async function GET(req) {
  try {
    await dbConnect();

    const token = req.cookies.get("token")?.value;
    if (!token) {
      return new Response(JSON.stringify({ success: false }), { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "ZONE_ADMIN") {
      return new Response(JSON.stringify({ success: false }), { status: 403 });
    }

    const zoneAdmin = await ZoneAdmin.findById(decoded.userId)
      .populate("assignedZones")
      .lean();

    return new Response(
      JSON.stringify({ success: true, zoneAdmin }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500 }
    );
  }
}

