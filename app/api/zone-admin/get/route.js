import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ZoneAdmin from "@/models/ZoneAdmin";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    const zoneAdmin = await ZoneAdmin.findById(id).populate(
      "assignedZones",
      "name"
    );

    if (!zoneAdmin) {
      return NextResponse.json(
        { success: false, message: "Zone Admin not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, zoneAdmin });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch Zone Admin" },
      { status: 500 }
    );
  }
}

