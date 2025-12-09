"use client";

import { useEffect, useState } from "react";

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    loadDepartments();
  }, []);

  async function loadDepartments() {
    setLoading(true);
    try {
      const res = await fetch("/api/departments/list");
      const j = await res.json();
      setDepartments(Array.isArray(j.departments) ? j.departments : []);
    } catch (err) {
      console.error(err);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }

  async function createDepartment(e) {
    e.preventDefault();
    if (!name.trim()) return alert("Enter department name");

    try {
      const res = await fetch("/api/departments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim() || null,
          description: description.trim() || null,
        }),
      });

      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Create failed");

      // Reset fields
      setName("");
      setCode("");
      setDescription("");

      await loadDepartments();
    } catch (err) {
      console.error(err);
      alert("Could not create department: " + err.message);
    }
  }

  async function editDepartment(dep) {
    const newName = prompt("Rename department", dep.name);
    if (!newName || !newName.trim()) return;

    try {
      const res = await fetch("/api/departments/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: dep._id, name: newName.trim() }),
      });

      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Update failed");

      await loadDepartments();
    } catch (err) {
      console.error(err);
      alert("Update failed: " + err.message);
    }
  }

  async function deleteDepartment(dep) {
    const ok = confirm(`Delete department "${dep.name}"?`);
    if (!ok) return;

    try {
      const res = await fetch("/api/departments/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: dep._id }),
      });

      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Delete failed");

      await loadDepartments();
    } catch (err) {
      console.error(err);
      alert("Delete failed: " + err.message);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Departments</h1>
        <div className="text-sm text-slate-600">Setup departments for employees</div>
      </div>

      {/* Create form */}
      <section className="bg-white p-4 rounded shadow mb-6">
        <form className="flex gap-3 items-center flex-wrap" onSubmit={createDepartment}>
          <input
            className="border rounded px-3 py-2 w-60"
            placeholder="Department name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            className="border rounded px-3 py-2 w-40"
            placeholder="Short code (optional)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />

          <input
            className="border rounded px-3 py-2 w-80"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <button className="px-4 py-2 rounded bg-sky-700 text-white">Create</button>
        </form>
      </section>

      {/* List */}
      <section className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-medium mb-3">Departments list</h2>

        {loading ? (
          <div>Loading...</div>
        ) : departments.length ? (
          <table className="w-full text-sm">
            <thead className="text-left text-slate-600">
              <tr>
                <th className="p-2">#</th>
                <th className="p-2">Name</th>
                <th className="p-2">Code</th>
                <th className="p-2">Description</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>

            <tbody>
              {departments.map((dep, i) => (
                <tr key={dep._id} className="border-t">
                  <td className="p-2 w-10">{i + 1}</td>
                  <td className="p-2">{dep.name}</td>
                  <td className="p-2">{dep.code || "-"}</td>
                  <td className="p-2">{dep.description || "-"}</td>
                  <td className="p-2">
                    <button
                      className="px-2 py-1 text-sm border rounded mr-2"
                      onClick={() => editDepartment(dep)}
                    >
                      Edit
                    </button>
                    <button
                      className="px-2 py-1 text-sm border rounded text-red-600"
                      onClick={() => deleteDepartment(dep)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-slate-500">No departments yet. Create one above.</div>
        )}
      </section>
    </div>
  );
}

