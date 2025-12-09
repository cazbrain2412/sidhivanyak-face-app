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

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // ---- EMPLOYEES ----
        const e = await fetch("/api/employees/descriptors");
        const ej = await e.json();
        const employeeCount = Array.isArray(ej.employees)
          ? ej.employees.length
          : 0;

        // ---- SUPERVISORS ----
        // NOTE: adjust `/api/supervisors/list` if your supervisors page uses a different URL.
        let supervisorCount = 0;
        try {
          const s = await fetch("/api/supervisors/list");
          const sj = await s.json();
          supervisorCount = Array.isArray(sj.supervisors)
            ? sj.supervisors.length
            : 0;
        } catch (err) {
          console.error("supervisors count error", err);
        }

        // ---- ZONES ----
        // Use same API that your Zones page uses
        // (for example /api/zones/list – change if needed).
        let zoneCount = 0;
        try {
          const z = await fetch("/api/zones/list");
          const zj = await z.json();
          zoneCount = Array.isArray(zj.zones) ? zj.zones.length : 0;
        } catch (err) {
          console.error("zones count error", err);
        }

        // ---- ATTENDANCE TODAY ----
        const att = await fetch("/api/attendance/list");
        const attJ = await att.json();
        const todayIso = new Date().toISOString().slice(0, 10);

        const attToday = Array.isArray(attJ.attendance)
          ? attJ.attendance.filter((a) => {
              const raw =
                a.timestamp || a.time || a.createdAt || a.date || null;
              if (!raw) return false;
              const d = new Date(raw);
              if (Number.isNaN(d.getTime())) return false;
              return d.toISOString().slice(0, 10) === todayIso;
            }).length
          : 0;

        setCounts({
          employees: employeeCount,
          supervisors: supervisorCount,
          zones: zoneCount,
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
        <Card
          title="Total Employees"
          value={loading ? "…" : counts.employees}
        />
        <Card
          title="Supervisors"
          value={loading ? "…" : counts.supervisors}
        />
        <Card title="Zones" value={loading ? "…" : counts.zones} />
        <Card
          title="Attendance Today"
          value={loading ? "…" : counts.attendanceToday}
        />
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

function formatAttendanceTime(row) {
  // Try multiple possible fields from the API
  const raw = row.timestamp || row.time || row.createdAt || row.date;

  if (!raw) return "-";

  // If backend already sends a formatted string, just show it
  if (typeof raw === "string" && !raw.includes("T")) {
    return raw;
  }

  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "-";

  return d.toLocaleString();
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
        const list = Array.isArray(j.attendance) ? j.attendance : [];
        setRows(list.slice(0, 10));
      } catch (err) {
        console.error(err);
        setRows([]);
      }
    }

    load();
    return () => {
      mounted = false;
    };
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
        {rows.map((r) => (
          <tr key={r.id} className="border-t">
            <td className="p-2">{formatAttendanceTime(r)}</td>
            <td className="p-2">{r.employeeName || "-"}</td>
            <td className="p-2">{r.employeeCode || "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

