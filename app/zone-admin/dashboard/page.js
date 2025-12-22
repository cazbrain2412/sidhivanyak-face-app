"use client";

import { useEffect, useState } from "react";

export default function ZoneAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    zones: 0,
    employees: 0,
    supervisors: 0,
    recentPunches: [],
  });

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    try {
      const res = await fetch("/api/zone-admin/dashboard");
      const json = await res.json();
      if (json.success) {
        setStats(json);
      }
    } catch (e) {
      console.error("Zone Admin dashboard error", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Zone Admin Dashboard</h1>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white shadow rounded p-4">
          <div className="text-sm text-gray-500">Zones Assigned</div>
          <div className="text-2xl font-bold">{stats.zones}</div>
        </div>

        <div className="bg-white shadow rounded p-4">
          <div className="text-sm text-gray-500">Total Employees</div>
          <div className="text-2xl font-bold">{stats.employees}</div>
        </div>

        <div className="bg-white shadow rounded p-4">
          <div className="text-sm text-gray-500">Total Supervisors</div>
          <div className="text-2xl font-bold">{stats.supervisors}</div>
        </div>
      </div>

      {/* RECENT PUNCHES */}
      <div className="bg-white shadow rounded p-4">
        <h2 className="text-lg font-semibold mb-3">Latest Punch Activity</h2>

        {stats.recentPunches.length === 0 ? (
          <div className="text-gray-500 text-sm">No recent activity</div>
        ) : (
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Employee</th>
                <th className="border p-2">Action</th>
                <th className="border p-2">Time (IST)</th>
                <th className="border p-2 text-left">Location</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentPunches.map((p, idx) => (
                <tr key={idx}>
                  <td className="border p-2">
                    {p.employeeName} ({p.employeeCode})
                  </td>
                  <td className="border p-2 text-center">
                    {p.action}
                  </td>
                  <td className="border p-2 text-center">
                    {new Date(p.time).toLocaleString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="border p-2">
                    {p.locationName || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

