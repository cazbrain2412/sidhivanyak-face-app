"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateZoneAdminPage() {
  const router = useRouter();

  const [zones, setZones] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    mobile: "",
    assignedZones: [] as string[],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔹 Fetch zones
  useEffect(() => {
  fetch("/api/zones/list", {
    credentials: "include",
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setZones(data.zones);
      }
    })
    .catch(err => {
      console.error("Failed to load zones", err);
    });
}, []);


  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleZoneSelect = (zoneId: string) => {
    setForm(prev => ({
      ...prev,
      assignedZones: prev.assignedZones.includes(zoneId)
        ? prev.assignedZones.filter(id => id !== zoneId)
        : [...prev.assignedZones, zoneId],
    }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/zone-admin/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to create Zone Admin");
        return;
      }

      alert("Zone Admin created successfully");
      router.push("/admin/dashboard");
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-4">Create Zone Admin</h1>

      {error && <p className="text-red-600 mb-3">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded"
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded"
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded"
        />

        <input
          name="mobile"
          placeholder="Mobile"
          value={form.mobile}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded"
        />

        <div>
          <p className="font-semibold mb-2">Assign Zones</p>
          {zones.length === 0 && (
  <p className="text-sm text-gray-500">No zones available</p>
)}

          <div className="grid grid-cols-2 gap-2">
            {zones.map((zone: any) => (
              <label key={zone._id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.assignedZones.includes(zone._id)}
                  onChange={() => handleZoneSelect(zone._id)}
                />
                {zone.name}
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded"
        >
          {loading ? "Creating..." : "Create Zone Admin"}
        </button>
      </form>
    </div>
  );
}

