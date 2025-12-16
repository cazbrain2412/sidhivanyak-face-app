import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import ZoneAdmin from "@/models/ZoneAdmin";

function getTokenFromCookie(req) {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map(c => c.trim());
  const tokenCookie = cookies.find(c => c.startsWith("token="));
  if (!tokenCookie) return null;

  return tokenCookie.split("=")[1];
}

export async function GET(req) {
  try {
    await dbConnect();
   const token = getTokenFromCookie(req);

    
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

