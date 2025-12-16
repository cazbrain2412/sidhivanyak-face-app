import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import dbConnect from "./mongodb";
import ZoneAdmin from "@/models/ZoneAdmin";

export async function getAuthContext() {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // SUPER ADMIN → full access
  if (decoded.role === "SUPER_ADMIN") {
    return { role: "SUPER_ADMIN" };
  }

  // ZONE ADMIN → restricted access
  if (decoded.role === "ZONE_ADMIN") {
    await dbConnect();

    const zoneAdmin = await ZoneAdmin.findById(decoded.userId)
      .select("assignedZones")
      .lean();

    return {
      role: "ZONE_ADMIN",
      assignedZones: zoneAdmin?.assignedZones || [],
    };
  }

  return null;
}

