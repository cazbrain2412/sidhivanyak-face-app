"use client";

import { useEffect, useState } from "react";

export default function AdminDivisionsPage() {
  const [zones, setZones] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [zoneId, setZoneId] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      // load zones
      const zRes = await fetch("/api/zones/list");
      const zJ = await zRes.json();
      const zList = Array.isArray(zJ.zones) ? zJ.zones : [];
      setZones(zList);
      if (!zoneId && zList[0]) setZoneId(zList[0]._id);

      // load divisions
      const dRes = await fetch("/api/divisions/list");
      const dJ = await dRes.json();
      const dList = Array.isArray(dJ.divisions) ? dJ.divisions : [];
      setDivisions(dList);
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
        body: JSON.stringify({ name: name.trim(), zoneId }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Create failed");
      setName("");
      await loadAll();
    } catch (err) {
      console.error(err);
      alert("Could not create division: " + (err.message || err));
    }
  }

  async function editDivision(div) {
    const newName = prompt("Rename division", div.name);
    if (!newName || !newName.trim() || newName.trim() === div.name) return;
    try {
      const res = await fetch("/api/divisions/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: div._id, name: newName.trim() }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Update failed");
      await loadAll();
    } catch (err) {
      console.error(err);
      alert("Update failed: " + (err.message || err));
    }
  }

  async function deleteDivision(div) {
    const ok = confirm(`Delete division "${div.name}"?`);
    if (!ok) return;
    try {
      const res = await fetch("/api/divisions/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: div._id }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Delete failed");
      await loadAll();
    } catch (err) {
      console.error(err);
      alert("Delete failed: " + (err.message || err));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Divisions</h1>
        <div className="text-sm text-slate-600">Create and manage divisions (belongs to a zone)</div>
      </div>

      <section className="bg-white p-4 rounded shadow mb-6">
        <form className="flex gap-3 items-center" onSubmit={createDivision}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New division name (e.g. Division X)"
            className="border rounded px-3 py-2 w-80"
          />

          <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} className="border rounded px-3 py-2">
            {zones.map(z => <option key={z._id} value={z._id}>{z.name}</option>)}
            {zones.length === 0 && <option value="">No zones (create zones first)</option>}
          </select>

          <button className="px-4 py-2 rounded bg-sky-700 text-white">Create Division</button>
          <div className="text-sm text-slate-500 ml-4">Divisions are mapped to Zones.</div>
        </form>
      </section>

      <section className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-medium mb-3">Divisions list</h2>

        {loading ? (
          <div>Loading...</div>
        ) : divisions.length ? (
          <table className="w-full text-sm">
            <thead className="text-left text-slate-600">
              <tr>
                <th className="p-2">#</th>
                <th className="p-2">Division Name</th>
                <th className="p-2">Zone</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {divisions.map((d, i) => (
                <tr key={d._id || i} className="border-t">
                  <td className="p-2 w-12">{i + 1}</td>
                  <td className="p-2">{d.name}</td>
                  <td className="p-2">{d.zoneName || "-"}</td>
                  <td className="p-2">
                    <button onClick={() => editDivision(d)} className="px-2 py-1 text-sm rounded border mr-2">Edit</button>
                    <button onClick={() => deleteDivision(d)} className="px-2 py-1 text-sm rounded border text-red-600">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-slate-500">No divisions yet. Create one using the form above.</div>
        )}
      </section>
    </div>
  );
}

