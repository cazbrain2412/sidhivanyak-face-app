import dbConnect from "@/lib/mongodb";
import Supervisor from "@/models/Supervisor";
import jwt from "jsonwebtoken";
import ZoneAdmin from "@/models/ZoneAdmin";

function getToken(req) {
  const c = req.headers.get("cookie");
  if (!c) return null;
  const t = c.split(";").map(v => v.trim()).find(v => v.startsWith("token="));
  return t ? t.split("=")[1] : null;
}

export async function GET(req) {
  await dbConnect();

  try {
    const token = getToken(req);
    if (!token) return Response.json({ success: false }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let filter = {};
    if (decoded.role === "ZONE_ADMIN") {
      const za = await ZoneAdmin.findById(decoded.userId).lean();
      filter.zone = { $in: za?.assignedZones || [] };
    }

    const supervisors = await Supervisor.find(filter).sort({ createdAt: -1 }).lean();
    return Response.json({ success: true, supervisors });
  } catch (e) {
    return Response.json({ success: false }, { status: 500 });
  }
}

