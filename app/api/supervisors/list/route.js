import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Supervisor from "@/models/Supervisor";
import Zone from "@/models/Zone";
import Division from "@/models/Division";
import mongoose from "mongoose";

export async function GET() {
  try {
    await connectDB();

    const supervisors = await Supervisor.find().lean();

    // ✅ Only keep valid ObjectIds
    const zoneIds = supervisors
      .map(s => s.zone)
      .filter(v => mongoose.Types.ObjectId.isValid(v));

    const divisionIds = supervisors
      .flatMap(s => s.divisions || [])
      .filter(v => mongoose.Types.ObjectId.isValid(v));

    const zones = zoneIds.length
      ? await Zone.find({ _id: { $in: zoneIds } }).lean()
      : [];

    const divisions = divisionIds.length
      ? await Division.find({ _id: { $in: divisionIds } }).lean()
      : [];

    const zoneMap = Object.fromEntries(
      zones.map(z => [String(z._id), z.name])
    );

    const divisionMap = Object.fromEntries(
      divisions.map(d => [String(d._id), d.name])
    );

    const formatted = supervisors.map(s => ({
      ...s,

      // Zone display
      zoneName: mongoose.Types.ObjectId.isValid(s.zone)
        ? zoneMap[String(s.zone)] || "—"
        : s.zone || "—",

      // Division display
      divisionNames: Array.isArray(s.divisions)
        ? s.divisions.map(v =>
            mongoose.Types.ObjectId.isValid(v)
              ? divisionMap[String(v)]
              : v
          ).filter(Boolean)
        : [],

      documents: Array.isArray(s.documents) ? s.documents : []
    }));

    return NextResponse.json({ supervisors: formatted });
  } catch (e) {
    console.error("SUPERVISOR LIST ERROR:", e);
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}


    
   

