"use client";

import { useEffect, useState } from "react";

export default function AdminReports() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);
    try {
      const res = await fetch("/api/attendance/list?month=" + new Date().toISOString().slice(0, 7));
      const json = await res.json();
      setAttendance(json.attendance || []);
    } catch (err) {
      console.error("Report load error", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Attendance Reports</h1>

      {loading && <div>Loading reports...</div>}

      {!loading && attendance.length === 0 && (
        <div className="text-gray-500">No attendance records found</div>
      )}

      {!loading && attendance.length > 0 && (
        <div className="overflow-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left">Employee</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Zone</th>
                <th className="px-3 py-2 text-left">Division</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((a, i) => (
                <tr key={i} className="border-t">
                  <td className="px-3 py-2">{a.employeeName || a.employeeCode}</td>
                  <td className="px-3 py-2">{a.date}</td>
                  <td className="px-3 py-2 font-semibold">{a.status}</td>
                  <td className="px-3 py-2">{a.zone || "-"}</td>
                  <td className="px-3 py-2">{a.division || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

