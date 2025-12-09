"use client";

import { useEffect, useState } from "react";

export default function AdminDashboardPage() {
  const [counts, setCounts] = useState({
    employees: 0,
    supervisors: 0,
    zones: 0,
    attendanceToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const today = new Date().toLocaleDateString();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // employees count
        const e = await fetch("/api/employees/descriptors");
        const ej = await e.json();
        const employeeCount = Array.isArray(ej.employees) ? ej.employees.length : 0;

        // supervisors count
        const s = await fetch("/api/supervisors/create"); // will 405 but we only want to hit the route namespace
        // instead call DB-light endpoint: use attendance list + employees as proxy
        const supRes = await fetch("/api/supervisors/create"); // placeholder: we'll replace with proper API later
        let supervisorCount = 0;
        try {
          const supJ = await supRes.json();
          if (Array.isArray(supJ.supervisors)) supervisorCount = supJ.supervisors.length;
        } catch (err) {
          supervisorCount = 1; // fallback until we add supervisors-list API
        }

        // zones (we don't yet have zones API; show distinct zones in employees)
        let zoneCount = 0;
        try {
          const allEmps = await fetch("/api/employees/by-supervisor", { method: "GET", headers: { Authorization: "" }});
          // fallback: count unique zone fields from employees list (we'll add proper zones API later)
          zoneCount = 0;
        } catch (err) {
          zoneCount = 1;
        }

        // attendance today
        const att = await fetch("/api/attendance/list");
        const attJ = await att.json();
        const todayIso = new Date().toISOString().slice(0,10);
        const attToday = Array.isArray(attJ.attendance)
          ? attJ.attendance.filter(a => (a.timestamp || "").slice(0,10) === todayIso).length
          : 0;

        setCounts({
          employees: employeeCount,
          supervisors: supervisorCount || 0,
          zones: zoneCount || 0,
          attendanceToday: attToday,
        });
      } catch (err) {
        console.error("dashboard load error", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Admin Dashboard</h1>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card title="Total Employees" value={loading ? "…" : counts.employees} />
        <Card title="Supervisors" value={loading ? "…" : counts.supervisors} />
        <Card title="Zones" value={loading ? "…" : counts.zones} />
        <Card title="Attendance Today" value={loading ? "…" : counts.attendanceToday} />
      </div>

      <section className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-medium mb-3">Recent Attendance</h2>
        <RecentAttendance />
      </section>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="p-4 bg-white rounded shadow-sm border">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="text-2xl font-bold mt-2">{value}</div>
    </div>
  );
}

function RecentAttendance() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const r = await fetch("/api/attendance/list");
        const j = await r.json();
        if (!mounted) return;
        setRows(Array.isArray(j.attendance) ? j.attendance.slice(0,10) : []);
      } catch (err) {
        console.error(err);
        setRows([]);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  if (rows === null) return <div>Loading...</div>;
  if (rows.length === 0) return <div>No attendance yet.</div>;

  return (
    <table className="w-full text-sm">
      <thead className="text-left text-slate-600">
        <tr>
          <th className="p-2">Time</th>
          <th className="p-2">Employee</th>
          <th className="p-2">Code</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.id} className="border-t">
            <td className="p-2">{new Date(r.timestamp).toLocaleString()}</td>
            <td className="p-2">{r.employeeName || "-"}</td>
            <td className="p-2">{r.employeeCode}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

