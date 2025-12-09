"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function SupervisorAttendanceInner() {

  const router = useRouter();
  const search = useSearchParams();

  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState("");
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [records, setRecords] = useState([]);
  const [loadingEmp, setLoadingEmp] = useState(true);
  const [loadingCal, setLoadingCal] = useState(false);

  // Init from query
  useEffect(() => {
    const empFromUrl = search.get("emp") || "";
    if (empFromUrl) setSelectedEmp(empFromUrl);
  }, [search]);

  // Load employees for this supervisor
  useEffect(() => {
    const token = localStorage.getItem("supervisorToken");
    if (!token) {
      router.replace("/supervisor/login");
      return;
    }

    async function loadEmployees() {
      try {
        setLoadingEmp(true);
        const res = await fetch("/api/employees/by-supervisor", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const json = await res.json();
        const list = json.employees || [];
        setEmployees(list);

        // default selected employee
        if (!selectedEmp && list.length > 0) {
          setSelectedEmp(list[0].code);
        }
      } catch (e) {
        console.error("loadEmployees error", e);
      } finally {
        setLoadingEmp(false);
      }
    }

    loadEmployees();
  }, [router, selectedEmp]);

  // Load calendar when employee or month changes
  useEffect(() => {
    const token = localStorage.getItem("supervisorToken");
    if (!token || !selectedEmp) return;

    async function loadCal() {
      try {
        setLoadingCal(true);
        const res = await fetch(
          `/api/attendance/list?month=${month}&employeeCode=${encodeURIComponent(
            selectedEmp
          )}`,
          { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
        );
        const json = await res.json();
        setRecords(json.attendance || []);
      } catch (e) {
        console.error("loadCal error", e);
      } finally {
        setLoadingCal(false);
      }
    }

    loadCal();
  }, [month, selectedEmp]);

  // Helpers
  function daysInMonth(ym) {
    const [year, m] = ym.split("-").map((x) => parseInt(x, 10));
    return new Date(year, m, 0).getDate();
  }

  function dayStatus(day) {
    // dateKey is usually YYYY-MM-DD
    const dKey = `${month}-${String(day).padStart(2, "0")}`;
    const dayRecs = records.filter((r) =>
      (r.date || "").startsWith(dKey)
    );
    if (dayRecs.length === 0) return "A";

    // If at least one record has both punchIn & punchOut -> Present
    for (const r of dayRecs) {
      if (r.punchIn && r.punchOut) return "P";
    }
    // Otherwise Half-day
    return "H";
  }

  function statusColor(st) {
    if (st === "P") return "bg-emerald-50 border-emerald-400 text-emerald-700";
    if (st === "H") return "bg-amber-50 border-amber-400 text-amber-700";
    return "bg-rose-50 border-rose-300 text-rose-700";
  }

  const currentEmp = employees.find((e) => e.code === selectedEmp) || null;
  const totalDays = daysInMonth(month);

  // Build array [1..totalDays]
  const daysArr = Array.from({ length: totalDays }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="w-full bg-white border-b shadow-sm px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-500">Attendance</div>
          <div className="font-semibold text-slate-800">
            Assigned employees — month view
          </div>
        </div>

        <input
          type="month"
          className="border border-slate-300 rounded-lg px-2 py-1 text-sm"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-4 max-w-5xl mx-auto w-full pb-20">
        <div className="grid md:grid-cols-[260px,1fr] gap-4">
          {/* Employee list */}
          <section className="bg-white rounded-xl shadow-sm p-3">
            <h3 className="font-semibold text-slate-800 text-sm mb-2">
              Employees
            </h3>
            {loadingEmp ? (
              <div className="text-xs text-slate-500">Loading…</div>
            ) : employees.length === 0 ? (
              <div className="text-xs text-slate-500">
                No employees assigned to you.
              </div>
            ) : (
              <ul className="space-y-1 text-sm">
                {employees.map((e) => (
                  <li key={e.code}>
                    <button
                      onClick={() => setSelectedEmp(e.code)}
                      className={`w-full text-left px-3 py-2 rounded-lg border text-xs ${
                        selectedEmp === e.code
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="font-medium">{e.name || e.code}</div>
                      <div className="text-[11px] text-slate-500">
                        {e.code} • {e.mobile || "-"}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Calendar */}
          <section className="bg-white rounded-xl shadow-sm p-4">
            {currentEmp ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-semibold text-slate-800 text-sm">
                      {currentEmp.name || currentEmp.code}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Records for {month}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      router.push(
                        "/supervisor/dashboard#emp-" +
                          encodeURIComponent(currentEmp.code)
                      )
                    }
                    className="text-xs px-3 py-1 rounded border border-slate-300 hover:bg-slate-100"
                  >
                    Back
                  </button>
                </div>

                {loadingCal ? (
                  <div className="text-xs text-slate-500">Loading calendar…</div>
                ) : (
                  <>
                    {/* Week headers */}
                    <div className="grid grid-cols-7 text-[11px] text-slate-500 mb-1">
                      <div className="text-center">Sun</div>
                      <div className="text-center">Mon</div>
                      <div className="text-center">Tue</div>
                      <div className="text-center">Wed</div>
                      <div className="text-center">Thu</div>
                      <div className="text-center">Fri</div>
                      <div className="text-center">Sat</div>
                    </div>

                    {/* Simple grid – just 7 columns, 5 rows approx */}
                    <div className="grid grid-cols-7 gap-1 text-xs">
                      {daysArr.map((d) => {
                        const st = dayStatus(d); // P/H/A
                        return (
                          <div
                            key={d}
                            className={`h-14 border rounded-md flex flex-col items-center justify-center ${statusColor(
                              st
                            )}`}
                          >
                            <div className="text-[11px] font-semibold">
                              {d}
                            </div>
                            <div className="text-[11px]">
                              {st === "P"
                                ? "P"
                                : st === "H"
                                ? "H"
                                : "A"}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-3 text-[11px] text-slate-500 flex gap-4">
                      <span>
                        <span className="inline-block w-3 h-3 bg-emerald-400 mr-1 rounded-sm" />
                        P = Present (In & Out)
                      </span>
                      <span>
                        <span className="inline-block w-3 h-3 bg-amber-400 mr-1 rounded-sm" />
                        H = Half-day (only In or Out)
                      </span>
                      <span>
                        <span className="inline-block w-3 h-3 bg-rose-400 mr-1 rounded-sm" />
                        A = Absent (no punch)
                      </span>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-sm text-slate-500">
                Select employee to view calendar.
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around py-2 text-xs">
        <button
          onClick={() => router.push("/supervisor/dashboard")}
          className="flex flex-col items-center text-slate-600"
        >
          Home
        </button>
        <button
          onClick={() => router.push("/supervisor/attendance")}
          className="flex flex-col items-center text-indigo-600 font-semibold"
        >
          Attendance
        </button>
        <button
          onClick={() => router.push("/supervisor/profile")}
          className="flex flex-col items-center text-slate-600"
        >
          Profile
        </button>
      </nav>
    </div>
  );
}
export default function SupervisorAttendancePage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-gray-500">Loading...</div>}>
      <SupervisorAttendanceInner />
    </Suspense>
  );
}

