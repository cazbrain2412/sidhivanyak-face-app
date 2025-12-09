/**
 * app/api/admin/persist-synth/route.js
 *
 * POST { date: "YYYY-MM-DD", employeeCode?: "E123" }
 * Scans the day's punch events (same logic as list synthesis), computes
 * punchIn/punchOut/hoursWorked/status and UPserts real Attendance docs.
 *
 * WARNING: this will create/overwrite Attendance docs for the specified date.
 * It only creates docs when no real date-doc exists (it will upsert to be safe).
 */

import dbConnect from "@/lib/mongodb";
import Attendance from "@/models/Attendance";

function buildDayRange(dateStr) {
  const [yyyy, mm, dd] = dateStr.split("-").map(Number);
  const start = new Date(yyyy, mm - 1, dd, 0, 0, 0, 0);
  const end = new Date(yyyy, mm - 1, dd, 23, 59, 59, 999);
  return { start, end };
}

function toDateKey(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// helper to compute hours/status
function computeStatus(punchIn, punchOut) {
  if (!punchIn && !punchOut) return { hoursWorked: 0, status: "ABSENT" };
  if (!punchOut) return { hoursWorked: 0, status: "HALF" };
  const diffMs = new Date(punchOut).getTime() - new Date(punchIn).getTime();
  const hoursWorked = diffMs / (1000 * 60 * 60);
  return { hoursWorked: Number(hoursWorked.toFixed(2)), status: hoursWorked >= 2 ? "PRESENT" : "HALF" };
}

export async function POST(req) {
  await dbConnect();
  try {
    const body = await req.json();
    const date = body?.date;
    const employeeCodeFilter = body?.employeeCode || null;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return new Response(JSON.stringify({ success: false, message: "Provide date YYYY-MM-DD" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const { start, end } = buildDayRange(date);

    // find candidate event docs in Attendance collection (these are the raw event docs with timestamp or only punch events)
    const q = {
      $or: [
        { timestamp: { $gte: start, $lte: end } },
        { punchIn: { $gte: start, $lte: end } },
        { createdAt: { $gte: start, $lte: end } },
      ],
    };
    if (employeeCodeFilter) q.employeeCode = employeeCodeFilter;

    const events = await Attendance.find(q).sort({ employeeCode: 1, timestamp: 1, punchIn: 1, createdAt: 1 }).lean();

    // Group by employeeCode
    const byEmp = {};
    for (const e of events) {
      const code = e.employeeCode || (e.employee && e.employee.code) || "UNKNOWN";
      const ts = e.timestamp ? new Date(e.timestamp) : (e.punchIn ? new Date(e.punchIn) : new Date(e.createdAt));
      if (!byEmp[code]) byEmp[code] = [];
      byEmp[code].push({ ts, raw: e });
    }

    const results = [];
    for (const code of Object.keys(byEmp)) {
      const arr = byEmp[code].sort((a, b) => a.ts - b.ts);
      const punchIn = arr[0]?.ts || null;
      const punchOut = arr.length > 1 ? arr[arr.length - 1].ts : null;
      const sampleRaw = arr[0]?.raw || {};

      const { hoursWorked, status } = computeStatus(punchIn, punchOut);

      const doc = {
        employeeCode: code,
        employeeName: sampleRaw.employeeName || sampleRaw.name || null,
        date,
        punchIn: punchIn ? punchIn.toISOString() : null,
        punchOut: punchOut ? punchOut.toISOString() : null,
        hoursWorked,
        status,
        // store the event ids for traceability
        sourceEvents: arr.map(x => x.raw._id),
        persistedAt: new Date(),
      };

      // Upsert attendance doc for employeeCode + date (do not remove other fields)
      const updated = await Attendance.findOneAndUpdate(
        { employeeCode: code, date },
        { $set: doc },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();

      results.push({ employeeCode: code, saved: true, doc: updated });
    }

    return new Response(JSON.stringify({ success: true, date, count: results.length, results }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("persist-synth error", err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

