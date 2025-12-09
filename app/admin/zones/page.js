"use client";

import { useEffect, useState } from "react";

export default function AdminZonesPage() {
  const [zones, setZones] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");

  useEffect(() => {
    loadZones();
  }, []);

  async function loadZones() {
    setLoading(true);
    try {
      const res = await fetch("/api/zones/list");
      const j = await res.json();
      setZones(Array.isArray(j.zones) ? j.zones : []);
    } catch (err) {
      console.error(err);
      setZones([]);
    } finally {
      setLoading(false);
    }
  }

  async function createZone(e) {
    e.preventDefault();
    if (!name.trim()) return alert("Enter zone name");
    try {
      const res = await fetch("/api/zones/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Create failed");
      setName("");
      // refresh list
      await loadZones();
    } catch (err) {
      console.error(err);
      alert("Could not create zone: " + (err.message || err));
    }
  }

  async function deleteZone(z) {
    const ok = confirm(`Delete zone "${z.name}"? This will remove it permanently.`);
    if (!ok) return;
    try {
      const res = await fetch("/api/zones/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: z._id }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Delete failed");
      await loadZones();
    } catch (err) {
      console.error(err);
      alert("Delete failed: " + (err.message || err));
    }
  }

  async function editZone(z) {
    const newName = prompt("Rename zone", z.name);
    if (!newName || !newName.trim() || newName.trim() === z.name) return;
    try {
      const res = await fetch("/api/zones/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: z._id, newName: newName.trim() }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Update failed");
      await loadZones();
    } catch (err) {
      console.error(err);
      alert("Update failed: " + (err.message || err));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Zones</h1>
        <div className="text-sm text-slate-600">Manage geographical areas</div>
      </div>

      <section className="bg-white p-4 rounded shadow mb-6">
        <form className="flex gap-3" onSubmit={createZone}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New zone name (e.g. Zone A)"
            className="border rounded px-3 py-2 w-80"
          />
          <button className="px-4 py-2 rounded bg-sky-700 text-white">Create Zone</button>
          <div className="text-sm text-slate-500 ml-4">Zone creation persists to DB.</div>
        </form>
      </section>

      <section className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-medium mb-3">Zones list</h2>

        {loading ? (
          <div>Loading...</div>
        ) : zones && zones.length ? (
          <table className="w-full text-sm">
            <thead className="text-left text-slate-600">
              <tr>
                <th className="p-2">#</th>
                <th className="p-2">Zone Name</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z, i) => (
                <tr key={z._id || i} className="border-t">
                  <td className="p-2 w-12">{i + 1}</td>
                  <td className="p-2">{z.name || z.title || "—"}</td>
                  <td className="p-2">
                    <button onClick={() => editZone(z)} className="px-2 py-1 text-sm rounded border mr-2">Edit</button>
                    <button onClick={() => deleteZone(z)} className="px-2 py-1 text-sm rounded border text-red-600">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-slate-500">No zones yet. Create one using the form above.</div>
        )}
      </section>
    </div>
  );
}

