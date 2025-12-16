"use client";

import { useEffect, useState } from "react";

export default function ZoneAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [latestAttendance, setLatestAttendance] = useState([]);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const res = await fetch("/api/zone-admin/dashboard");
        const json = await res.json();

        if (!json.success) {
          throw new Error("Failed to load dashboard");
        }

        setStats(json.stats);
        setLatestAttendance(json.latestAttendance || []);
      } catch (err) {
        console.error("Zone admin dashboard error:", err);
        alert("Could not load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Zone Admin Dashboard</h1>
        <span className="text-sm text-slate-500">Today Overview</span>
      </div>

      {/* STATS CARDS */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Employees" value={stats.totalEmployees} />
          <StatCard title="Divisions" value={stats.totalDivisions} />
          <StatCard title="Supervisors" value={stats.totalSupervisors} />
          <StatCard title="Present Today" value={stats.present} />
          <StatCard title="Half Day" value={stats.half} />
          <StatCard title="Absent" value={stats.absent} />
        </div>
      )}

      {/* LATEST ATTENDANCE */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="font-medium text-lg">Latest Attendance</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-2 text-left">Employee</th>
                <th className="px-4 py-2 text-left">Code</th>
                <th className="px-4 py-2 text-left">Division</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {latestAttendance.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-4 py-4 text-center text-slate-500">
                    No attendance records
                  </td>
                </tr>
              )}

              {latestAttendance.map((a) => (
                <tr key={a._id} className="border-t">
                  <td className="px-4 py-2">{a.employeeName}</td>
                  <td className="px-4 py-2">{a.employeeCode}</td>
                  <td className="px-4 py-2">{a.division || "-"}</td>
                  <td className="px-4 py-2 font-medium">
                    {a.status === "PRESENT" && (
                      <span className="text-green-600">PRESENT</span>
                    )}
                    {a.status === "HALF" && (
                      <span className="text-orange-600">HALF</span>
                    )}
                    {a.status === "ABSENT" && (
                      <span className="text-red-600">ABSENT</span>
                    )}
                  </td>
                  <td className="px-4 py-2">{a.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------- SMALL STAT CARD ---------- */
function StatCard({ title, value }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value ?? 0}</div>
    </div>
  );
}

