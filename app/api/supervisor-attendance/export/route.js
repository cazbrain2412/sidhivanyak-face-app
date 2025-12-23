import dbConnect from "@/lib/mongodb";
import SupervisorAttendance from "@/models/SupervisorAttendance";
import Supervisor from "@/models/Supervisor";
import { NextResponse } from "next/server";

function getDaysOfMonth(year, month) {
  const days = [];
  const last = new Date(year, month, 0).getDate();
  for (let d = 1; d <= last; d++) {
    days.push(`${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  return days;
}

export async function GET(req) {
  await dbConnect();

  const url = new URL(req.url);
  const month = url.searchParams.get("month");
  const supervisorCode = url.searchParams.get("supervisor");

  if (!month) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const [year, m] = month.split("-").map(Number);
  const days = getDaysOfMonth(year, m);

  const supQuery = {};
  if (supervisorCode) supQuery.code = supervisorCode;

  const supervisors = await Supervisor.find(supQuery).lean();
  const supCodes = supervisors.map(s => s.code);

  const records = await SupervisorAttendance.find({
    supervisorCode: { $in: supCodes },
    date: { $in: days },
  }).lean();

  const map = {};
  records.forEach(r => {
    map[`${r.supervisorCode}|${r.date}`] = r.status;
  });

  // CSV HEADER
  let csv = "Supervisor Code,Supervisor Name";
  days.forEach(d => (csv += `,${d}`));
  csv += ",Present,Absent,Half\n";

  supervisors.forEach(sup => {
    let present = 0, absent = 0, half = 0;

    let row = `${sup.code},${sup.name}`;

    days.forEach(d => {
      const status = map[`${sup.code}|${d}`] || "A";
      row += `,${status}`;
      if (status === "P") present++;
      else if (status === "H") half++;
      else absent++;
    });

    row += `,${present},${absent},${half}\n`;
    csv += row;
  });

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="supervisor-attendance-${month}.csv"`,
    },
  });
}

