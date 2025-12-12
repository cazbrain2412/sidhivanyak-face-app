"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SupervisorDashboardPage() {
  const router = useRouter();
  const [supervisorName, setSupervisorName] = useState(
    typeof window !== "undefined" ? localStorage.getItem("supervisorName") || "" : ""
  );
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchEmployees() {
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("supervisorToken") : null;
      const res = await fetch("/api/employees/by-supervisor", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const j = await res.json();
      if (res.ok && j.success) setEmployees(j.employees || []);
      else setEmployees([]);
    } catch (err) {
      console.error("fetch employees", err);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }

  function openCamera() {
    router.push("/supervisor/face-punch?self=1");
  }

  function viewCalendar() {
    router.push("/supervisor/attendance");
  }

  function onPunch(emp) {
    // navigate to face-punch with employee code
    router.push(`/supervisor/face-punch?emp=${encodeURIComponent(emp.code)}`);
  }

  function onEnroll(emp) {
    router.push(`/supervisor/face-enroll?emp=${encodeURIComponent(emp.code)}`);
  }

  function onEmployeeCalendar(emp) {
    router.push(`/supervisor/attendance?emp=${encodeURIComponent(emp.code)}`);
  }

  const visible = employees.filter((e) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (e.name || "").toLowerCase().includes(s) || (e.code || "").toLowerCase().includes(s) || (e.mobile || "").includes(s);
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <header className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3">
        <img src="/logo.png" alt="Siddhi Vinayak Group" className="w-12 h-12 rounded-full object-cover" />
        <div>
          <div className="text-xs text-gray-500">Supervisor App</div>
          <div className="text-lg font-semibold">Siddhi Vinayak Group</div>
          <div className="text-sm text-indigo-600 font-medium">{supervisorName ? supervisorName : "Welcome"}</div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto mt-5 space-y-5">
        {/* My Attendance card */}
        <section className="bg-white rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">My Attendance</h3>
            <p className="text-sm text-gray-500 mt-1">Mark your Punch In / Punch Out using face</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={openCamera}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700"
            >
              Open Camera
            </button>
            <button
              onClick={viewCalendar}
              className="bg-white border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              View Calendar
            </button>
          </div>
        </section>

        {/* Assigned employees */}
        <section className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-semibold">Assigned Employees</h3>
            <div className="text-sm text-gray-400">{loading ? "Loading…" : `${employees.length} assigned`}</div>
          </div>

          <div className="mt-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employees by name, code or mobile"
              className="w-full rounded-lg border border-gray-200 p-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div className="mt-4 space-y-3">
            {visible.length === 0 && (
              <div className="text-center text-sm text-gray-500 py-6">No employees found</div>
            )}
            {visible.map((emp) => (
              <div key={emp._id || emp.code} className="border border-gray-100 rounded-lg p-3 flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{emp.name || emp.code}</div>
                  <div className="text-xs text-gray-500 mt-1">{emp.code} • {emp.mobile || "—"}</div>
                  <div className="text-xs text-gray-400 mt-2">No punches yet</div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <button onClick={() => onPunch(emp)} className="bg-green-600 text-white px-3 py-1 rounded-md text-sm">Punch</button>
                  <button onClick={() => onEnroll(emp)} className="bg-amber-400 text-white px-3 py-1 rounded-md text-sm">Enroll Face</button>
                  <button onClick={() => onEmployeeCalendar(emp)} className="bg-white border border-gray-200 px-3 py-1 rounded-md text-sm">Calendar</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent punches */}
        <section className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="text-md font-semibold">Recent Punches</h3>
          <div className="mt-3 text-sm text-gray-600">
            {/* We don't know your API shape for recent punches; show placeholder */}
            <div className="py-2">No recent punches yet</div>
          </div>
        </section>

      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-2">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={() => router.push("/")} className="text-indigo-600">Home</button>
          <button onClick={() => router.push("/attendance")} className="text-gray-600">Attendance</button>
          <button onClick={() => router.push("/supervisor/profile")} className="text-gray-600">Profile</button>
        </div>
      </nav>
    </div>
  );
}
