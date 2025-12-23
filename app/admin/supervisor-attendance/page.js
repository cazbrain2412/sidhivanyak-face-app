"use client";

import { useEffect, useState } from "react";

export default function SupervisorAttendancePage() {
  const [month, setMonth] = useState("");
  const [zone, setZone] = useState("");
  const [supervisor, setSupervisor] = useState("");

  const [zones, setZones] = useState([]);
  const [supervisors, setSupervisors] = useState([]);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // ---------------- LOAD MASTER DATA ----------------
  useEffect(() => {
    fetch("/api/zones/list")
      .then(r => r.json())
      .then(j => setZones(j.zones || []));

    fetch("/api/supervisors/list")
      .then(r => r.json())
      .then(j => setSupervisors(j.supervisors || []));
  }, []);

  // ---------------- LOAD CALENDAR ----------------
  async function loadReport() {
  if (!month) {
    alert("Please select month");
    return;
  }

  setLoading(true);

  try {
    const params = new URLSearchParams();

    // REQUIRED
    params.set("month", month);

 // ✅ DATE RANGE (IMPORTANT)
if (fromDate) params.set("fromDate", fromDate);
if (toDate) params.set("toDate", toDate);


    // OPTIONAL FILTERS
    if (zone) params.set("zone", zone);
    if (supervisor) params.set("supervisor", supervisor);

    // ✅ DATE RANGE (IMPORTANT)
    if (fromDate) params.set("fromDate", fromDate);
    if (toDate) params.set("toDate", toDate);

    const res = await fetch(
      `/api/supervisor-attendance/calendar?${params.toString()}`
    );

    const json = await res.json();

    if (json.success && json.days && json.rows) {
      setData(json);
    } else {
      console.error("Invalid API response:", json);
      alert("No data found");
      setData({ days: [], rows: [] });
    }
  } catch (err) {
    console.error("SUPERVISOR REPORT ERROR:", err);
    alert("Server error");
  } finally {
    setLoading(false);
  }
}

   

 

  // ---------------- EXPORT CSV ----------------
  function exportCSV() {
    if (!month) {
      alert("Please select month");
      return;
    }

    const params = new URLSearchParams();
    params.set("month", month);
    if (zone) params.set("zone", zone);
    if (supervisor) params.set("supervisor", supervisor);

    window.location.href =
      `/api/supervisor-attendance/export?${params.toString()}`;
  }

  return (
    <div className="p-4 overflow-x-auto">
      <h1 className="text-xl font-bold mb-4">Supervisor Attendance</h1>

      {/* FILTER BAR */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <input
          type="month"
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="border px-2 py-1"
        />

        <select
          value={zone}
          onChange={e => setZone(e.target.value)}
          className="border px-2 py-1"
        >
          <option value="">All Zones</option>
          {zones.map(z => (
            <option key={z._id} value={z.name}>
              {z.name}
            </option>
          ))}
        </select>

        <select
          value={supervisor}
          onChange={e => setSupervisor(e.target.value)}
          className="border px-2 py-1"
        >
          <option value="">All Supervisors</option>
          {supervisors.map(s => (
            <option key={s._id} value={s.code}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

<input
  type="date"
  value={fromDate}
  onChange={e => setFromDate(e.target.value)}
  className="border px-2 py-1"
/>

<input
  type="date"
  value={toDate}
  onChange={e => setToDate(e.target.value)}
  className="border px-2 py-1"
/>


      {/* ACTIONS */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={loadReport}
          className="border px-4 py-1 bg-gray-100"
        >
          Apply
        </button>

        <button
          onClick={exportCSV}
          className="border px-4 py-1 bg-green-100"
        >
          Export CSV
        </button>
      </div>

      {loading && <div>Loading…</div>}

      {/* CALENDAR TABLE */}
      {data && (
        <table className="border-collapse border w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 sticky left-0 bg-gray-100 z-10">
                Supervisor
              </th>

              {data.days.map(d => (
                <th key={d.date} className="border p-1 text-center">
                  <div className="text-xs">{d.weekday}</div>
                  <div className="font-semibold">{d.day}</div>
                </th>
              ))}

              <th className="border p-2">P</th>
              <th className="border p-2">A</th>
              <th className="border p-2">H</th>
            </tr>
          </thead>

          <tbody>
            {data.rows.map(row => (
              <tr key={row.supervisor.code}>
                <td className="border p-2 sticky left-0 bg-white">
                  <div className="font-medium">{row.supervisor.name}</div>
                  <div className="text-xs text-gray-500">
                    {row.supervisor.code}
                  </div>
                </td>

                {data.days.map(d => {
                  const s = row.attendance[d.date];
                  const bg =
                    s === "P"
                      ? "bg-green-200"
                      : s === "H"
                      ? "bg-yellow-200"
                      : "bg-red-100";

                  return (
                    <td
                      key={d.date}
                      className={`border text-center ${bg}`}
                    >
                      {s}
                    </td>
                  );
                })}

                <td className="border text-center font-semibold">
                  {row.summary.present}
                </td>
                <td className="border text-center font-semibold">
                  {row.summary.absent}
                </td>
                <td className="border text-center font-semibold">
                  {row.summary.half}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

