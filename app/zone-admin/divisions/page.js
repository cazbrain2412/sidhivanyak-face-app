"use client";

import { useEffect, useState } from "react";

export default function AdminDivisionsPage() {
  const [zones, setZones] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [zoneId, setZoneId] = useState("");

  const [attendanceType, setAttendanceType] = useState("DOUBLE_PUNCH");
  const [minHoursForPresent, setMinHoursForPresent] = useState(2);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      // Zones
      const zRes = await fetch("/api/zones/list");
      const zJ = await zRes.json();
      const zList = Array.isArray(zJ.zones) ? zJ.zones : [];
      setZones(zList);
      if (!zoneId && zList[0]) setZoneId(zList[0]._id);

      // Divisions
      const dRes = await fetch("/api/divisions/list");
      const dJ = await dRes.json();
      setDivisions(Array.isArray(dJ.divisions) ? dJ.divisions : []);
    } catch (err) {
      console.error("loadAll error", err);
      setZones([]);
      setDivisions([]);
    } finally {
      setLoading(false);
    }
  }

  async function createDivision(e) {
    e.preventDefault();

    if (!name.trim()) return alert("Enter division name");
    if (!zoneId) return alert("Select a zone");

    try {
      const res = await fetch("/api/divisions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          zoneId,
          attendanceType,
          minHoursForPresent:
            attendanceType === "DOUBLE_PUNCH" ? minHoursForPresent : 0,
        }),
      });

      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Create failed");

      setName("");
      loadAll(); // intentionally NOT awaited
    } catch (err) {
      console.error(err);
      alert("Could not create division: " + err.message);
    }
  }

  async function editDivision(div) {
    const newName = prompt("Rename division", div.name);
    if (!newName || !newName.trim() || newName === div.name) return;

    try {
      const res = await fetch("/api/divisions/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: div._id, name: newName.trim() }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Update failed");
      loadAll();
    } catch (err) {
      alert("Update failed");
    }
  }

  async function deleteDivision(div) {
    if (!confirm(`Delete "${div.name}"?`)) return;

    try {
      const res = await fetch("/api/divisions/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: div._id }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Delete failed");
      loadAll();
    } catch (err) {
      alert("Delete failed");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Divisions</h1>
        <div className="text-sm text-slate-600">
          Create and manage divisions (belongs to a zone)
        </div>
      </div>

      <section className="bg-white p-4 rounded shadow mb-6">
        <form onSubmit={createDivision} className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Division name"
            className="border rounded px-3 py-2 w-80"
          />

          <select
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
            className="border rounded px-3 py-2"
          >
            {zones.map((z) => (
              <option key={z._id} value={z._id}>
                {z.name}
              </option>
            ))}
          </select>

          <div>
            <label className="block text-sm mb-1">Attendance Type</label>
            <select
              className="border p-2 rounded"
              value={attendanceType}
              onChange={(e) => setAttendanceType(e.target.value)}
            >
              <option value="DOUBLE_PUNCH">Double Punch</option>
              <option value="SINGLE_PUNCH">Single Punch</option>
            </select>
          </div>

          {attendanceType === "DOUBLE_PUNCH" && (
            <div>
              <label className="block text-sm mb-1">
                Min Hours for Present
              </label>
              <input
                type="number"
                min="1"
                className="border p-2 rounded"
                value={minHoursForPresent}
                onChange={(e) =>
                  setMinHoursForPresent(Number(e.target.value))
                }
              />
            </div>
          )}

          <button className="px-4 py-2 rounded bg-sky-700 text-white">
            Create Division
          </button>
        </form>
      </section>

      <section className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-medium mb-3">Divisions List</h2>

        {loading ? (
          <div>Loading...</div>
        ) : divisions.length ? (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Zone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {divisions.map((d, i) => (
                <tr key={d._id}>
                  <td>{i + 1}</td>
                  <td>{d.name}</td>
                  <td>{d.zoneName || "-"}</td>
                  <td>
                    <button onClick={() => editDivision(d)}>Edit</button>{" "}
                    <button onClick={() => deleteDivision(d)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div>No divisions yet</div>
        )}
      </section>
    </div>
  );
}

