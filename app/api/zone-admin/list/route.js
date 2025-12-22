import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ZoneAdmin from "@/models/ZoneAdmin";

export async function GET() {
  try {
    await dbConnect();

    const zoneAdmins = await ZoneAdmin.find()
      .populate("assignedZones", "name")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      zoneAdmins,
    });
  } catch (error) {
    console.error("Zone admin list error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch zone admins" },
      { status: 500 }
    );
  }
}

