import dbConnect from "@/lib/mongodb";
import Zone from "@/models/Zone";
import jwt from "jsonwebtoken";

export async function GET(req) {
  await dbConnect();

  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return Response.json({ success: false }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // SUPER ADMIN → all zones
    if (decoded.role === "SUPER_ADMIN") {
      const zones = await Zone.find().sort({ createdAt: -1 });
      return Response.json({ success: true, zones });
    }

    // ZONE ADMIN → only assigned zones
    if (decoded.role === "ZONE_ADMIN") {
      const zones = await Zone.find({
        _id: { $in: decoded.assignedZones || [] },
      });
      return Response.json({ success: true, zones });
    }

    return Response.json({ success: false }, { status: 403 });
  } catch (err) {
    console.error(err);
    return Response.json({ success: false }, { status: 500 });
  }
}

