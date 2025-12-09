import dbConnect from "../../../../lib/mongodb";
import mongoose from "mongoose";
import { PassThrough } from "stream";

// Reuse Attendance model definition as used elsewhere
const AttendanceSchema = new mongoose.Schema({
  employeeCode: String,
  employeeName: String,
  supervisorCode: String,
  zone: String,
  division: String,
  department: String,
  date: Date,
  punchIn: Date,
  punchOut: Date,
  durationMinutes: Number,
  status: String,
  notes: String,
}, { timestamps: true });

let Attendance;
try { Attendance = mongoose.model("Attendance"); } 
catch (e) { Attendance = mongoose.model("Attendance", AttendanceSchema); }

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0,0,0,0);
}
function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth()+1, 0, 23,59,59,999);
}

export async function GET(req) {
  try {
    await dbConnect();
    const url = new URL(req.url);
    const month = url.searchParams.get("month"); // YYYY-MM
    const zone = url.searchParams.get("zone");
    const division = url.searchParams.get("division");
    const department = url.searchParams.get("department");
    const supervisor = url.searchParams.get("supervisor");
    const q = url.searchParams.get("q");

    const filter = {};
    if (month) {
      // parse YYYY-MM
      const [yy, mm] = month.split("-");
      if (!yy || !mm) {
        return new Response(JSON.stringify({ success:false, error: "invalid month" }), { status: 400, headers: { "Content-Type":"application/json" }});
      }
      const d = new Date(parseInt(yy,10), parseInt(mm,10)-1, 1);
      filter.date = { $gte: startOfMonth(d), $lte: endOfMonth(d) };
    }
    if (zone) filter.zone = zone;
    if (division) filter.division = division;
    if (department) filter.department = department;
    if (supervisor) filter.supervisorCode = supervisor;
    if (q) filter.$or = [{ employeeCode: new RegExp(q,"i") }, { employeeName: new RegExp(q,"i") }];

    const cursor = Attendance.find(filter).cursor();

    // Build CSV header
    const header = [
      "employeeCode","employeeName","date","status","punchIn","punchOut","durationMinutes","supervisorCode","zone","division","department","notes"
    ].join(",") + "\n";

    // We'll stream result
    const stream = new PassThrough();
    stream.push(header);

    for await (const doc of cursor) {
      const row = [
        `"${String(doc.employeeCode||"")}"`,
        `"${String(doc.employeeName||"")}"`,
        `"${doc.date ? doc.date.toISOString().slice(0,10) : ""}"`,
        `"${String(doc.status||"")}"`,
        `"${doc.punchIn ? new Date(doc.punchIn).toISOString() : ""}"`,
        `"${doc.punchOut ? new Date(doc.punchOut).toISOString() : ""}"`,
        `"${doc.durationMinutes != null ? doc.durationMinutes : ""}"`,
        `"${String(doc.supervisorCode||"")}"`,
        `"${String(doc.zone||"")}"`,
        `"${String(doc.division||"")}"`,
        `"${String(doc.department||"")}"`,
        `"${String(doc.notes||"")}"`,
      ].join(",") + "\n";
      stream.push(row);
    }

    stream.push(null);
    const filename = `attendance_${month || "all"}_${new Date().toISOString().slice(0,10)}.csv`;
    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("attendance/export error", err);
    return new Response(JSON.stringify({ success:false, error: err.message || String(err) }), { status: 500, headers: { "Content-Type":"application/json" }});
  }
}

