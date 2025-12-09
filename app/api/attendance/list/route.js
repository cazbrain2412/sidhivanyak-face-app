/**
 * app/api/attendance/list/route.js
 * Robust attendance listing that also synthesizes attendance rows from
 * single 'punch' events (documents with `timestamp`) when full attendance docs
 * (punchIn/punchOut/date) are not present.
 *
 * Behavior:
 * - ?recent=N  -> return recent N raw attendance/punch docs
 * - ?month=YYYY-MM -> return docs in month
 * - ?date=YYYY-MM-DD&employeeCode=E123 -> try:
 *      1) attendance docs where date field matches
 *      2) fallback: synthesize attendance rows from punch events (timestamp)
 * - ?employeeCode=E123 -> return that employee's recent rows
 *
 * Note: synthesized rows include `derived: true` and `punchIn` & `punchOut` fields.
 */

import dbConnect from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import { NextResponse } from "next/server";

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

export async function GET(req) {
  await dbConnect();
  try {
    const url = new URL(req.url);
    const date = url.searchParams.get("date"); // YYYY-MM-DD
    const employeeCode = url.searchParams.get("employeeCode");
    const recent = url.searchParams.get("recent") || url.searchParams.get("r");
    const month = url.searchParams.get("month");

    // 1) recent raw docs
    if (recent) {
      const n = Math.min(500, parseInt(recent, 10) || 50);
      const docs = await Attendance.find({}).sort({ createdAt: -1 }).limit(n).lean();
      return NextResponse.json({ success: true, attendance: docs });
    }
     // 2) month range
if (month) {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) {
    return NextResponse.json({ success: false, message: "Invalid month" }, { status: 400 });
  }

  // Build date range as date keys (strings) YYYY-MM-DD so we match the attendance.date field.
  // Start = YYYY-MM-01, End = YYYY-MM-lastDay
  const startKey = `${y}-${String(m).padStart(2, "0")}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const endKey = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  // Query by `date` field (string in YYYY-MM-DD) so calendar filters correctly by day-of-month.
  const q = { date: { $gte: startKey, $lte: endKey } };
  if (employeeCode) q.employeeCode = employeeCode;

  const docs = await Attendance.find(q).sort({ date: 1 }).lean();
  return NextResponse.json({ success: true, attendance: docs });
}


    

    // Helper to fetch attendance docs by date field
    async function fetchByDateField(dateKey) {
      const q = { date: dateKey };
      if (employeeCode) q.employeeCode = employeeCode;
      const docs = await Attendance.find(q).sort({ date: 1 }).lean();
      return docs || [];
    }

    // Helper to fetch punch events (docs with `timestamp`) within day range
    async function fetchPunchEventsForDay(dateKey) {
      const { start, end } = buildDayRange(dateKey);
      const q = {
        $or: [
          { timestamp: { $exists: true, $gte: start, $lte: end } },
          { punchIn: { $exists: true, $gte: start, $lte: end } },
          { createdAt: { $exists: true, $gte: start, $lte: end } },
        ],
      };
      if (employeeCode) q.employeeCode = employeeCode;
      // We want all candidate punch-style docs (these may be raw events)
      const evs = await Attendance.find(q).sort({ employeeCode: 1, timestamp: 1, punchIn: 1, createdAt: 1 }).lean();
      return evs || [];
    }

    // 3) if date param given: try to return attendance docs, else synthesize from events
    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ success: false, message: "Invalid date format (use YYYY-MM-DD)" }, { status: 400 });
      }

      // First, attempt to get real attendance docs with date field
      let docs = await fetchByDateField(date);
      // If found, return
      if (docs && docs.length > 0) {
        return NextResponse.json({ success: true, attendance: docs });
      }

      // Not found: attempt to synthesize attendance rows from punch events in same day
      const events = await fetchPunchEventsForDay(date);
      if (!events || events.length === 0) {
        return NextResponse.json({ success: true, attendance: [] });
      }

      // Group events by employeeCode and compute earliest (in) and latest (out)
      const byEmp = {};
      for (const e of events) {
        const code = e.employeeCode || (e.employee && e.employee.code) || "UNKNOWN";
        const ts = e.timestamp ? new Date(e.timestamp) : (e.punchIn ? new Date(e.punchIn) : new Date(e.createdAt));
        if (!byEmp[code]) byEmp[code] = [];
        byEmp[code].push({ ts, raw: e });
      }

      const synthesized = [];
      for (const code of Object.keys(byEmp)) {
        const arr = byEmp[code].sort((a, b) => a.ts - b.ts);
        const punchIn = arr[0].ts;
        const punchOut = arr.length > 1 ? arr[arr.length - 1].ts : null;
        const sampleRaw = arr[0].raw || {};

        // compute hoursWorked & status (2-hour rule)
        let hoursWorked = 0;
        let status = "HALF";
        if (punchIn && punchOut) {
          const diffMs = new Date(punchOut).getTime() - new Date(punchIn).getTime();
          hoursWorked = diffMs / (1000 * 60 * 60);
          status = hoursWorked >= 2 ? "PRESENT" : "HALF";
        } else if (punchIn && !punchOut) {
          // only one event -> treat as HALF
          hoursWorked = 0;
          status = "HALF";
        } else {
          status = "ABSENT";
        }

        const row = {
          employeeCode: code,
          employeeName: sampleRaw.employeeName || sampleRaw.name || null,
          date,
          punchIn: punchIn ? punchIn.toISOString() : null,
          punchOut: punchOut ? punchOut.toISOString() : null,
          hoursWorked: Number(hoursWorked.toFixed(2)),
          status,
          derived: true,
          sourceEvents: arr.map(x => ({ id: x.raw._id, ts: x.raw.timestamp || x.raw.punchIn || x.raw.createdAt })),
        };
        synthesized.push(row);
      }

      // return synthesized rows
      return NextResponse.json({ success: true, attendance: synthesized });
    }

    // 4) If only employeeCode provided => return that employee's last N rows
    if (employeeCode) {
      // combine true attendance docs + synthesized days (last 200)
      const realDocs = await Attendance.find({ employeeCode }).sort({ date: -1, createdAt: -1 }).limit(200).lean();

      // also check for raw events in last 30 days and synthesize if needed
      const daysBack = 30;
      const now = new Date();
      const synthesized = [];
      for (let i = 0; i < daysBack; i++) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dateKey = toDateKey(d);
        // skip if a real doc exists for this date
        if (realDocs.some(r => r.date === dateKey)) continue;
        const evs = await fetchPunchEventsForDay(dateKey);
        const evsForEmp = evs.filter(e => (e.employeeCode || (e.employee && e.employee.code)) === employeeCode);
        if (evsForEmp.length === 0) continue;
        const arr = evsForEmp.map(e => ({ ts: e.timestamp ? new Date(e.timestamp) : (e.punchIn ? new Date(e.punchIn) : new Date(e.createdAt)), raw: e }))
                             .sort((a,b)=>a.ts-b.ts);
        const punchIn = arr[0].ts;
        const punchOut = arr.length>1 ? arr[arr.length-1].ts : null;

        // compute hoursWorked & status (2-hour rule)
        let hoursWorked = 0;
        let status = "HALF";
        if (punchIn && punchOut) {
          const diffMs = new Date(punchOut).getTime() - new Date(punchIn).getTime();
          hoursWorked = diffMs / (1000 * 60 * 60);
          status = hoursWorked >= 2 ? "PRESENT" : "HALF";
        } else if (punchIn && !punchOut) {
          hoursWorked = 0;
          status = "HALF";
        } else {
          status = "ABSENT";
        }

        synthesized.push({
          employeeCode,
          employeeName: arr[0].raw.employeeName || arr[0].raw.name || null,
          date: dateKey,
          punchIn: punchIn ? punchIn.toISOString() : null,
          punchOut: punchOut ? punchOut.toISOString() : null,
          hoursWorked: Number(hoursWorked.toFixed(2)),
          status,
          derived: true,
          sourceEvents: arr.map(x=>({ id:x.raw._id, ts: x.raw.timestamp || x.raw.punchIn || x.raw.createdAt })),
        });
      }

      // merge real + synthesized, remove duplicates by date (prefer real)
      const synthByDate = {};
      for (const s of synthesized) synthByDate[s.date] = s;
      const merged = [];
      const seen = new Set();
      for (const r of realDocs) {
        merged.push(r);
        seen.add(r.date);
      }
      for (const s of synthesized) {
        if (!seen.has(s.date)) merged.push(s);
      }

      return NextResponse.json({ success: true, attendance: merged });
    }

    // Default: return recent 50
    const docs = await Attendance.find({}).sort({ createdAt: -1 }).limit(50).lean();
    return NextResponse.json({ success: true, attendance: docs });
  } catch (err) {
    console.error("attendance list error", err);
    return NextResponse.json({ success: false, message: String(err) }, { status: 500 });
  }
}

