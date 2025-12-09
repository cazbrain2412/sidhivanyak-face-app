// app/api/divisions/list/route.js
import dbConnect from "../../../../lib/mongodb";
import Division from "../../../../models/Division";
import Zone from "../../../../models/Zone";
import mongoose from "mongoose";

export async function GET(req) {
  try {
    await dbConnect();
    const q = Object.fromEntries(new URL(req.url).searchParams.entries());
    // optional zoneId filter: /api/divisions/list?zoneId=...
    const filter = {};
    if (q.zoneId && mongoose.Types.ObjectId.isValid(q.zoneId)) filter.zoneId = q.zoneId;

    const divs = await Division.find(filter).sort({ createdAt: -1 }).lean();

    // attach zone name
    const zoneIds = [...new Set(divs.map(d => String(d.zoneId)))].filter(Boolean);
    const zones = await Zone.find({ _id: { $in: zoneIds } }).lean();
    const zoneMap = (zones || []).reduce((m,z)=>{ m[String(z._id)] = z.name; return m; }, {});

    const out = divs.map(d => ({ ...d, zoneName: zoneMap[String(d.zoneId)] || null }));
    return new Response(JSON.stringify({ success: true, divisions: out }), { status: 200, headers: { "Content-Type": "application/json" }});
  } catch (err) {
    console.error("division list error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message || String(err) }), { status: 500, headers: { "Content-Type": "application/json" }});
  }
}

