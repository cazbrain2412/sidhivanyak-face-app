"use client";

import { useEffect, useState } from "react";

export default function AttendanceReportsCalendar() {
  const [month, setMonth] = useState("2025-12");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [zone, setZone] = useState("");
  const [division, setDivision] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [employee, setEmployee] = useState("");

  const [zones, setZones] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // ---------------- LOAD FILTER MASTER DATA ----------------
  useEffect(() => {
    fetch("/api/zones/list").then(r => r.json()).then(j => setZones(j.zones || []));
    fetch("/api/divisions/list").then(r => r.json()).then(j => setDivisions(j.divisions || []));
    fetch("/api/supervisors/list").then(r => r.json()).then(j => setSupervisors(j.supervisors || []));
  }, []);

  // ---------------- LOAD EMPLOYEES BY SUPERVISOR ----------------
  useEffect(() => {
    if (!supervisor) {
      setEmployees([]);
      setEmployee("");
      return;
    }

    fetch(`/api/employees/by-supervisor?supervisor=${supervisor}`)
      .then(r => r.json())
      .then(j => setEmployees(j.employees || []));
  }, [supervisor]);

  // ---------------- LOAD CALENDAR REPORT ----------------
  async function loadCalendar() {
    if (!month) return;

    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.set("month", month);

      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);
      if (zone) params.set("zone", zone);
      if (division) params.set("division", division);
      if (supervisor) params.set("supervisor", supervisor);
      if (employee) params.set("employee", employee);

      const res = await fetch(`/api/reports/calendar?${params.toString()}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("CALENDAR REPORT ERROR:", err);
      alert("Failed to load report");
    } finally {
      setLoading(false); // ✅ FIXES LOADING ISSUE
    }
  }

  // auto load on month change
  useEffect(() => {
    loadCalendar();
  }, [month]);

  // ---------------- EXPORT CSV ----------------
  function exportCSV() {
    const params = new URLSearchParams({
      month,
      zone,
      division,
      supervisor,
      employee,
      fromDate,
      toDate,
    });
    window.location.href = `/api/reports/export?${params.toString()}`;
  }

  if (!data) return <div className="p-4">Loading…</div>;

  return (
    <div className="p-4 overflow-x-auto">
      <h1 className="text-xl font-bold mb-4">Attendance Calendar Report</h1>

      {/* FILTER BAR */}
      <div className="grid grid-cols-7 gap-3 mb-4">
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="border px-2 py-1" />
        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border px-2 py-1" />
        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border px-2 py-1" />

        <select value={zone} onChange={e => setZone(e.target.value)} className="border px-2 py-1">
          <option value="">All Zones</option>
          {zones.map(z => <option key={z._id} value={z.name}>{z.name}</option>)}
        </select>

        <select value={division} onChange={e => setDivision(e.target.value)} className="border px-2 py-1">
          <option value="">All Divisions</option>
          {divisions.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
        </select>

        <select value={supervisor} onChange={e => setSupervisor(e.target.value)} className="border px-2 py-1">
          <option value="">All Supervisors</option>
          {supervisors.map(s => <option key={s._id} value={s.code}>{s.name}</option>)}
        </select>

        <select value={employee} onChange={e => setEmployee(e.target.value)} className="border px-2 py-1">
          <option value="">All Employees</option>
          {employees.map(emp => (
            <option key={emp._id} value={emp.code}>
              {emp.name} ({emp.code})
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-3 mb-4">
        <button onClick={loadCalendar} className="border px-4 py-1 bg-gray-100">
          Apply
        </button>
        <button onClick={exportCSV} className="border px-4 py-1 bg-green-100">
          Export CSV
        </button>
      </div>

      {loading && <div className="mb-2">Refreshing…</div>}

      {/* CALENDAR TABLE (UNCHANGED LOGIC) */}
      <table className="border-collapse border w-full text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 sticky left-0 bg-gray-100 z-10">Employee</th>
            {data.days.map(d => (
              <th key={d.date} className="border p-1 text-center min-w-[48px]">
                <div className="text-xs">{d.weekday}</div>
                <div className="font-semibold">{d.day}</div>
              </th>
            ))}
            <th className="border p-2">P</th>
            <th className="border p-2">A</th>
            <th className="border p-2">H</th>
            <th className="border p-2">L</th>
          </tr>
        </thead>

        <tbody>
          {data.rows.map(row => (
            <tr key={row.employee.code}>
              <td className="border p-2 sticky left-0 bg-white z-10">
                <div className="font-medium">{row.employee.name}</div>
                <div className="text-xs text-gray-500">{row.employee.code}</div>
              </td>

              {data.days.map(d => {
                const s = row.attendance[d.date];
                const bg =
                  s === "P" ? "bg-green-200"
                  : s === "H" ? "bg-yellow-200"
                  : s === "L" ? "bg-blue-200"
                  : "bg-red-100";

                return (
                  <td key={d.date} className={`border text-center ${bg}`}>
                    {s}
                  </td>
                );
              })}

              <td className="border text-center font-semibold">{row.summary.present}</td>
              <td className="border text-center font-semibold">{row.summary.absent}</td>
              <td className="border text-center font-semibold">{row.summary.half}</td>
              <td className="border text-center font-semibold">{row.summary.leave}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

