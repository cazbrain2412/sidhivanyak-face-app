"use client";

import { useEffect, useState } from "react";

/* ADMIN – Calendar grid with vertical employees + horizontal weekdays
   - Click a cell -> open right-side drawer (edit punch in/out/status/notes)
   - Click employee name -> open right-side drawer (employee monthly summary + list)
   - Uses /api/employees/list and /api/attendance/list?month=YYYY-MM
   - Save calls /api/attendance/mark with employeeCode + date (and punches/status/notes)
   - Export calls /api/attendance/export?month=YYYY-MM
*/

function daysInMonth(yyyy, mm) {
  return new Date(yyyy, mm, 0).getDate();
}

function dayOfWeekForDate(yyyy, mm, dd) {
  // JS: 0=Sun..6=Sat -> convert to 0=Mon..6=Sun index
  const d = new Date(yyyy, mm - 1, dd);
  const jsDay = d.getDay(); // 0..6 (Sun..Sat)
  return (jsDay + 6) % 7; // Mon=0 .. Sun=6
}

/**
 * Show time in **IST (Asia/Kolkata)** always.
 * Used everywhere in Admin to display punch in/out.
 */
function formatTimeShort(ts) {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

/**
 * Extract latitude/longitude from various possible shapes on attendance record.
 * We DO NOT change backend logic, just read whatever is present.
 */
function extractLatLngFromRecord(a) {
  if (!a || typeof a !== "object") return { lat: null, lng: null };

  let lat = null;
  let lng = null;

  // common patterns
  if (typeof a.lat === "number" && typeof a.lng === "number") {
    lat = a.lat;
    lng = a.lng;
  } else if (typeof a.latitude === "number" && typeof a.longitude === "number") {
    lat = a.latitude;
    lng = a.longitude;
  } else if (a.location && typeof a.location === "object") {
    if (typeof a.location.lat === "number" && typeof a.location.lng === "number") {
      lat = a.location.lat;
      lng = a.location.lng;
    } else if (
      typeof a.location.latitude === "number" &&
      typeof a.location.longitude === "number"
    ) {
      lat = a.location.latitude;
      lng = a.location.longitude;
    }
  } else if (a.coords && typeof a.coords === "object") {
    if (typeof a.coords.lat === "number" && typeof a.coords.lng === "number") {
      lat = a.coords.lat;
      lng = a.coords.lng;
    } else if (
      typeof a.coords.latitude === "number" &&
      typeof a.coords.longitude === "number"
    ) {
      lat = a.coords.latitude;
      lng = a.coords.longitude;
    }
  }

  // if numbers but as strings
  if (lat == null && typeof a.lat === "string" && typeof a.lng === "string") {
    const nLat = Number(a.lat);
    const nLng = Number(a.lng);
    if (!Number.isNaN(nLat) && !Number.isNaN(nLng)) {
      lat = nLat;
      lng = nLng;
    }
  }
  if (
    lat == null &&
    typeof a.latitude === "string" &&
    typeof a.longitude === "string"
  ) {
    const nLat = Number(a.latitude);
    const nLng = Number(a.longitude);
    if (!Number.isNaN(nLat) && !Number.isNaN(nLng)) {
      lat = nLat;
      lng = nLng;
    }
  }

  return { lat, lng };
}

/**
 * Short location text for UI:
 * - Prefer human readable name (locationName / location)
 * - Else show "lat,lng" truncated
 */
function formatLocationShort(a) {
  if (!a) return "";
  if (typeof a.locationName === "string" && a.locationName.trim()) {
    return a.locationName.trim();
  }
  if (typeof a.location === "string" && a.location.trim()) {
    return a.location.trim();
  }

  const { lat, lng } = extractLatLngFromRecord(a);
  if (lat != null && lng != null) {
    try {
      const latStr = Number(lat).toFixed(4);
      const lngStr = Number(lng).toFixed(4);
      return `${latStr}, ${lngStr}`;
    } catch {
      return "";
    }
  }
  return "";
}

/**
 * Key for map: employeeCode + YYYY-MM-DD
 */
function cellKeyFor(empCode, day, yearNum, monthNum) {
  const d = new Date(yearNum, monthNum - 1, day);
  return `${empCode}|${d.toISOString().slice(0, 10)}`;
}

export default function AdminAttendanceCalendar() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const [month, setMonth] = useState(`${yyyy}-${mm}`); // YYYY-MM

  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]); // attendance docs for month
  const [loading, setLoading] = useState(true);

  // filters
  const [zones, setZones] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [supervisors, setSupervisors] = useState([]);

  const [zone, setZone] = useState("");
  const [division, setDivision] = useState("");
  const [department, setDepartment] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [q, setQ] = useState("");

  // drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState("cell"); // "cell" or "employee"
  const [activeEmployee, setActiveEmployee] = useState(null); // employee object
  const [activeDay, setActiveDay] = useState(null); // numeric day (1..N)
  const [cellRecord, setCellRecord] = useState(null); // attendance doc for that cell (may be null if none)
  const [saving, setSaving] = useState(false);

  // Drawer form state for editing cell
  const [formPunchIn, setFormPunchIn] = useState("");
  const [formPunchOut, setFormPunchOut] = useState("");
  const [formStatus, setFormStatus] = useState("");
  const [formNotes, setFormNotes] = useState("");

  useEffect(() => {
    loadFilters();
    fetchEmployees();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    fetchAttendance();
    // eslint-disable-next-line
  }, [month]);

  async function loadFilters() {
    try {
      const z = await fetch("/api/zones/list")
        .then((r) => r.json())
        .catch(() => ({ zones: [] }));
      setZones(z.zones || []);

      const d = await fetch("/api/divisions/list")
        .then((r) => r.json())
        .catch(() => ({ divisions: [] }));
      setDivisions(d.divisions || []);

      const dept = await fetch("/api/departments/list")
        .then((r) => r.json())
        .catch(() => ({ departments: [] }));
      setDepartments(dept.departments || []);

      const s = await fetch("/api/supervisors/list")
        .then((r) => r.json())
        .catch(() => ({ supervisors: [] }));
      setSupervisors(s.supervisors || []);
    } catch (err) {
      console.error("loadFilters", err);
    }
  }

  async function fetchEmployees() {
    setLoading(true);
    try {
      const res = await fetch("/api/zone-admin/employees/list")
      const j = await res.json();
      setEmployees(Array.isArray(j.employees) ? j.employees : []);
    } catch (err) {
      console.error("fetchEmployees", err);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAttendance() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (month) params.set("month", month);
     const res = await fetch(
  `/api/zone-admin/attendance/list?month=${month}&${params.toString()}`
);

      const j = await res.json();
      setAttendance(Array.isArray(j.attendance) ? j.attendance : []);
    } catch (err) {
      console.error("fetchAttendance", err);
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  }

  // build a lookup: key = `${employeeCode}|${YYYY-MM-DD}` -> attendance doc
  function buildAttendanceMap() {
    const map = {};
    for (const a of attendance || []) {
      if (!a || !a.date || !a.employeeCode) continue;

      // IMPORTANT:
      // a.date is already YYYY-MM-DD (day from server in IST logic).
      // Do NOT convert with new Date(...).toISOString() (that moves day in UTC).
      const keyDate = a.date;

      const key = `${a.employeeCode}|${keyDate}`;
      map[key] = a;
    }
    return map;
  }

  const attMap = buildAttendanceMap();

  // filtered employee list
  const filteredEmployees = employees.filter((e) => {
    if (zone && e.zone !== zone) return false;
    if (division && e.division !== division) return false;
    if (department && e.department !== department) return false;
    if (supervisor && e.supervisorCode !== supervisor) return false;
    if (q && !(`${e.name} ${e.code}`.toLowerCase().includes(q.toLowerCase())))
      return false;
    return true;
  });

  // calendar geometry
  const [yy, mmStr] = month.split("-");
  const yearNum = parseInt(yy, 10);
  const monthNum = parseInt(mmStr, 10);
  const days = daysInMonth(yearNum, monthNum);
  // week day of 1st (Mon=0..Sun=6)
  const firstWeekday = dayOfWeekForDate(yearNum, monthNum, 1);
  // firstWeekday currently not used but kept for future layout tweaks

  function openCellDrawer(emp, day) {
    const key = cellKeyFor(emp.code, day, yearNum, monthNum);
    const rec = attMap[key] || null;
    setActiveEmployee(emp);
    setActiveDay(day);
    setCellRecord(rec);
    setDrawerMode("cell");
    setDrawerOpen(true);
  }

  function openEmployeeDrawer(emp) {
    setActiveEmployee(emp);
    setActiveDay(null);
    setCellRecord(null);
    setDrawerMode("employee");
    setDrawerOpen(true);
  }

  // compute per-employee summary for month
  function computeEmployeeSummary(emp) {
    let present = 0,
      absent = 0,
      leave = 0,
      incomplete = 0,
      total = 0;
    for (let day = 1; day <= days; day++) {
      const key = cellKeyFor(emp.code, day, yearNum, monthNum);
      const r = attMap[key];
      total++;
      if (!r) absent++;
      else if (r.status === "present") present++;
      else if (r.status === "leave") leave++;
      else if (r.status === "incomplete") incomplete++;
      else absent++;
    }
    return { present, absent, leave, incomplete, total };
  }

  // when drawer opens in cell mode, populate form
  useEffect(() => {
    if (!drawerOpen) return;
    if (drawerMode === "cell") {
      if (cellRecord) {
        // Convert stored Date/string -> value for <input type="datetime-local">
        // Using "sv-SE" keeps format "YYYY-MM-DDTHH:mm"
        setFormPunchIn(
          cellRecord.punchIn
            ? new Date(cellRecord.punchIn)
                .toLocaleString("sv-SE")
                .slice(0, 16)
            : ""
        );

        setFormPunchOut(
          cellRecord.punchOut
            ? new Date(cellRecord.punchOut)
                .toLocaleString("sv-SE")
                .slice(0, 16)
            : ""
        );

        setFormStatus(cellRecord.status || "");
        setFormNotes(cellRecord.notes || "");
      } else {
        // empty form for new entry
        setFormPunchIn("");
        setFormPunchOut("");
        setFormStatus("");
        setFormNotes("");
      }
    } else if (drawerMode === "employee") {
      // clear cell form
      setFormPunchIn("");
      setFormPunchOut("");
      setFormStatus("");
      setFormNotes("");
    }
    // eslint-disable-next-line
  }, [drawerOpen, cellRecord, drawerMode]);

  // Save handler — either create/update attendance for a specific date
  async function saveCell() {
    if (!activeEmployee || !activeDay)
      return alert("No employee/day selected");
    setSaving(true);
    try {
      // build ISO date for selected day
      const d = new Date(yearNum, monthNum - 1, activeDay);
      const dateISO = d.toISOString().slice(0, 10); // YYYY-MM-DD

      const payload = {
        employeeCode: activeEmployee.code,
        employeeName: activeEmployee.name,
        date: dateISO,
      };

      // Browser gives local time (IST for your users). new Date(...) keeps that
      // and JSON.stringify will send ISO string to API.
      if (formPunchIn) payload.punchIn = new Date(formPunchIn);
      if (formPunchOut) payload.punchOut = new Date(formPunchOut);

      if (formStatus) payload.status = formStatus;
      if (formNotes) payload.notes = formNotes;

      const res = await fetch("/api/attendance/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "save failed");

      // ensure UI picks up updated values — refresh twice (immediate + shortly after)
      await fetchAttendance();
      setTimeout(() => {
        fetchAttendance();
      }, 400);

      alert("Saved");
      setDrawerOpen(false);
    } catch (err) {
      console.error("saveCell err", err);
      alert("Save failed: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  }

  async function deleteCellRecord() {
    if (!cellRecord || !cellRecord._id) return alert("No record to delete");
    if (!confirm("Delete this attendance record?")) return;
    try {
      const res = await fetch("/api/attendance/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cellRecord._id }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "delete failed");

      // Refresh immediately and again shortly after to ensure UI shows the change
      await fetchAttendance();
      setTimeout(() => {
        fetchAttendance();
      }, 400);

      alert("Deleted");
      setDrawerOpen(false);
    } catch (err) {
      console.error("deleteCell err", err);
      alert("Delete failed: " + (err.message || err));
    }
  }

  function exportCSV() {
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    if (zone) params.set("zone", zone);
    if (division) params.set("division", division);
    if (department) params.set("department", department);
    if (supervisor) params.set("supervisor", supervisor);
    if (q) params.set("q", q);
    window.location.href = "/api/attendance/export?" + params.toString();
  }

  // helper render for weekday names Mon..Sun
  const weekdayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="p-4 flex gap-4">
      {/* Left column: filters + employee list */}
      <div style={{ width: 320 }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-semibold">Attendance — Calendar</h2>
            <div className="text-sm text-slate-500">
              Month: <strong>{month}</strong>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchAttendance}
              className="px-3 py-1 border rounded"
            >
              Refresh
            </button>
            <button
              onClick={exportCSV}
              className="px-3 py-1 border rounded"
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="mb-3">
          <label className="text-sm">Month</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border px-2 py-1 rounded w-full"
          />
        </div>

        <div className="flex gap-2 mb-3">
          <select
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            className="border px-2 py-1 rounded w-full"
          >
            <option value="">All Zones</option>
            {zones.map((z) => (
              <option key={z._id} value={z.name}>
                {z.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 mb-3">
          <select
            value={division}
            onChange={(e) => setDivision(e.target.value)}
            className="border px-2 py-1 rounded w-1/2"
          >
            <option value="">All Divisions</option>
            {divisions.map((d) => (
              <option key={d._id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="border px-2 py-1 rounded w-1/2"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <select
            value={supervisor}
            onChange={(e) => setSupervisor(e.target.value)}
            className="border px-2 py-1 rounded w-full"
          >
            <option value="">All Supervisors</option>
            {supervisors.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name} — {s.code}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <input
            placeholder="Search name or code"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="border px-2 py-1 rounded w-full"
          />
        </div>

        <div
          style={{
            maxHeight: "60vh",
            overflowY: "auto",
            borderTop: "1px solid #eee",
            paddingTop: 8,
          }}
        >
          {loading ? (
            <div>Loading employees…</div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-sm text-slate-500 p-2">No employees</div>
          ) : (
            filteredEmployees.map((emp) => {
              const summary = computeEmployeeSummary(emp);
              return (
                <div
                  key={emp.code}
                  className="p-2 border-b flex items-center justify-between"
                  style={{ cursor: "pointer" }}
                >
                  <div onClick={() => openEmployeeDrawer(emp)}>
                    <div style={{ fontWeight: 700 }}>{emp.name}</div>
                    <div style={{ fontSize: 12, color: "#666" }}>
                      {emp.code} • {emp.supervisorCode || "-"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", minWidth: 70 }}>
                    <div style={{ fontSize: 12 }}>
                      P: <strong>{summary.present}</strong>
                    </div>
                    <div style={{ fontSize: 12 }}>
                      A: <strong>{summary.absent}</strong>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right: calendar grid */}
      <div style={{ flex: 1, overflowX: "auto" }}>
        <div
          style={{
            overflowX: "auto",
            border: "1px solid #e6e6e6",
            borderRadius: 6,
          }}
        >
          <table
            className="w-full text-sm"
            style={{
              borderCollapse: "collapse",
              minWidth: Math.max(900, days * 56 + 300),
            }}
          >
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th
                  style={{
                    position: "sticky",
                    left: 0,
                    background: "#fff",
                    zIndex: 3,
                    borderRight: "1px solid #eee",
                    padding: 8,
                    minWidth: 220,
                  }}
                >
                  Employee
                </th>
                {/* Render day numbers header with weekday label above each date */}
                {Array.from({ length: days }).map((_, idx) => {
                  const day = idx + 1;
                  const jsDate = new Date(yearNum, monthNum - 1, day);
                  const weekdayIdx = (jsDate.getDay() + 6) % 7;
                  return (
                    <th
                      key={idx}
                      style={{
                        padding: 6,
                        textAlign: "center",
                        minWidth: 56,
                      }}
                    >
                      <div style={{ fontSize: 11, color: "#666" }}>
                        {weekdayNames[weekdayIdx]}
                      </div>
                      <div
                        style={{ fontSize: 13, fontWeight: 700 }}
                      >
                        {day}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={days + 1} className="p-4">
                    No employees for selected filters
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr
                    key={emp.code}
                    style={{ borderTop: "1px solid #f1f5f9" }}
                  >
                    <td
                      style={{
                        position: "sticky",
                        left: 0,
                        background: "#fff",
                        zIndex: 2,
                        padding: 8,
                        borderRight: "1px solid #eee",
                        minWidth: 220,
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{emp.name}</div>
                      <div style={{ fontSize: 12, color: "#666" }}>
                        {emp.code} — {emp.supervisorCode || "-"}
                      </div>
                    </td>

                    {Array.from({ length: days }).map((_, idx) => {
                      const day = idx + 1;
                      const key = cellKeyFor(
                        emp.code,
                        day,
                        yearNum,
                        monthNum
                      );
                      const a = attMap[key];

                      const label = (() => {
                        if (!a) return "A";
                        if (a.status) return a.status[0].toUpperCase();
                        // Auto-derive status from punches
                        if (a.punchIn && a.punchOut) return "P";
                        if (a.punchIn && !a.punchOut) return "I";
                        if (!a.punchIn && !a.punchOut) return "A";
                        return "A";
                      })();

                      const punchText = a
                        ? `${formatTimeShort(a.punchIn)}${
                            a.punchOut
                              ? " / " + formatTimeShort(a.punchOut)
                              : ""
                          }`
                        : "";

                      const locShort = a ? formatLocationShort(a) : "";

                      const tooltip = a
                        ? `${a.status || ""} ${punchText}${
                            locShort ? " • " + locShort : ""
                          }`
                        : "Absent";

                      return (
                        <td
                          key={idx}
                          onClick={() => openCellDrawer(emp, day)}
                          style={{
                            padding: 6,
                            textAlign: "center",
                            cursor: "pointer",
                            verticalAlign: "top",
                          }}
                        >
                          <div
                            title={tooltip}
                            style={{
                              width: 56,
                              height: 54,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: 6,
                            }}
                          >
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                              }}
                            >
                              {label}
                            </div>
                            <div
                              style={{
                                fontSize: 10,
                                color: "#333",
                                marginTop: 2,
                              }}
                            >
                              {punchText}
                            </div>
                            {locShort && (
                              <div
                                style={{
                                  fontSize: 8,
                                  color: "#6b7280",
                                  marginTop: 1,
                                  maxWidth: 52,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {locShort}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right-side drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: drawerOpen ? 0 : "-520px",
          width: 520,
          height: "100vh",
          background: "#fff",
          boxShadow: "-8px 0 24px rgba(0,0,0,0.08)",
          transition: "right 220ms ease",
          zIndex: 90,
          padding: 16,
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <div style={{ fontWeight: 700 }}>
            {drawerMode === "cell"
              ? `Edit — ${
                  activeEmployee ? activeEmployee.name : ""
                } ${
                  activeDay
                    ? `(${month}-${String(activeDay).padStart(2, "0")})`
                    : ""
                }`
              : activeEmployee
              ? `${activeEmployee.name} — Summary`
              : "Employee"}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setDrawerOpen(false)}
              className="px-3 py-1 border rounded"
            >
              Close
            </button>
          </div>
        </div>

        {drawerMode === "cell" ? (
          <div>
            <div className="mb-3">
              <label className="text-sm">Employee</label>
              <div style={{ fontWeight: 700 }}>
                {activeEmployee?.name}{" "}
                <span className="text-slate-500">
                  ({activeEmployee?.code})
                </span>
              </div>
              <div className="text-xs text-slate-500">
                {activeEmployee?.supervisorCode || "-"}
              </div>
            </div>

            <div className="mb-3">
              <label className="text-sm">Date</label>
              <div>
                {month} - {activeDay}
              </div>
            </div>

            <div className="mb-3">
              <label className="text-sm">Punch In</label>
              <input
                type="datetime-local"
                value={formPunchIn}
                onChange={(e) => setFormPunchIn(e.target.value)}
                className="border px-2 py-2 rounded w-full"
              />
            </div>

            <div className="mb-3">
              <label className="text-sm">Punch Out</label>
              <input
                type="datetime-local"
                value={formPunchOut}
                onChange={(e) => setFormPunchOut(e.target.value)}
                className="border px-2 py-2 rounded w-full"
              />
            </div>

            <div className="mb-3">
              <label className="text-sm">Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                className="border px-2 py-2 rounded w-full"
              >
                <option value="">(auto)</option>
                <option value="present">present</option>
                <option value="absent">absent</option>
                <option value="leave">leave</option>
                <option value="incomplete">incomplete</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="text-sm">Notes</label>
              <textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="border px-2 py-2 rounded w-full"
                rows={3}
              />
            </div>

            {/* Location – read-only from punch record */}
            {cellRecord && (
              <div className="mb-3">
                <label className="text-sm">Location (auto-captured)</label>
                <div className="text-xs text-slate-600">
                  {formatLocationShort(cellRecord) || "—"}
                  {(() => {
                    const { lat, lng } = extractLatLngFromRecord(cellRecord);
                    if (lat == null || lng == null) return null;
                    const url = `https://www.google.com/maps?q=${lat},${lng}`;
                    return (
                      <>
                        {" "}
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sky-600 underline"
                        >
                          View map
                        </a>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={saveCell}
                disabled={saving}
                className="px-4 py-2 bg-sky-700 text-white rounded"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              {cellRecord && cellRecord._id && (
                <button
                  onClick={deleteCellRecord}
                  className="px-4 py-2 border rounded text-red-600"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ) : (
          // employee summary mode
          <div>
            {activeEmployee ? (
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  {activeEmployee.name}{" "}
                  <span className="text-slate-500">
                    ({activeEmployee.code})
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  {(() => {
                    const s = computeEmployeeSummary(activeEmployee);
                    return (
                      <>
                        <div className="p-2 border rounded">
                          <div className="text-sm">Present</div>
                          <div style={{ fontWeight: 700 }}>
                            {s.present}
                          </div>
                        </div>
                        <div className="p-2 border rounded">
                          <div className="text-sm">Absent</div>
                          <div style={{ fontWeight: 700 }}>
                            {s.absent}
                          </div>
                        </div>
                        <div className="p-2 border rounded">
                          <div className="text-sm">Leave</div>
                          <div style={{ fontWeight: 700 }}>
                            {s.leave}
                          </div>
                        </div>
                        <div className="p-2 border rounded">
                          <div className="text-sm">Incomplete</div>
                          <div style={{ fontWeight: 700 }}>
                            {s.incomplete}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      marginBottom: 6,
                    }}
                  >
                    Detailed
                  </div>
                  <div
                    style={{
                      maxHeight: "50vh",
                      overflowY: "auto",
                    }}
                  >
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-600 border-b">
                          <th className="p-2">Date</th>
                          <th className="p-2">Punch In</th>
                          <th className="p-2">Punch Out</th>
                          <th className="p-2">Status</th>
                          <th className="p-2">Location</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: days }).map((_, idx) => {
                          const d = idx + 1;
                          const key = cellKeyFor(
                            activeEmployee.code,
                            d,
                            yearNum,
                            monthNum
                          );
                          const a = attMap[key];
                          const dateStr = new Date(
                            yearNum,
                            monthNum - 1,
                            d
                          )
                            .toISOString()
                            .slice(0, 10);
                          return (
                            <tr key={d} className="border-b">
                              <td className="p-2">{dateStr}</td>
                              <td className="p-2">
                                {a ? formatTimeShort(a.punchIn) : "-"}
                              </td>
                              <td className="p-2">
                                {a ? formatTimeShort(a.punchOut) : "-"}
                              </td>
                              <td className="p-2">
                                {a ? a.status : "absent"}
                              </td>
                              <td className="p-2 text-xs">
                                {a ? formatLocationShort(a) : "-"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div>No employee selected</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

