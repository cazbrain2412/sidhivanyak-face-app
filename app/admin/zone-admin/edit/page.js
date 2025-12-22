"use client";
export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";


function EditZoneAdminInner() {


  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");

  const [zones, setZones] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    mobile: "",
    assignedZones: [],
  });

  useEffect(() => {
    fetch("/api/zones/list")
      .then(res => res.json())
      .then(res => setZones(res.zones || []));

    fetch(`/api/zone-admin/get?id=${id}`)
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setForm({
            name: res.zoneAdmin.name,
            email: res.zoneAdmin.email,
            mobile: res.zoneAdmin.mobile,
            password: "",
            assignedZones: res.zoneAdmin.assignedZones.map(z => z._id),
          });
        }
      });
  }, [id]);

  const toggleZone = zid => {
    setForm(f => ({
      ...f,
      assignedZones: f.assignedZones.includes(zid)
        ? f.assignedZones.filter(i => i !== zid)
        : [...f.assignedZones, zid],
    }));
  };

  const submit = async e => {
    e.preventDefault();

    await fetch("/api/zone-admin/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...form }),
    });

    router.push("/admin/zone-admin");
  };

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Edit Zone Admin</h1>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            className="w-full border p-2 rounded"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            className="w-full border p-2 rounded"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Mobile</label>
          <input
            className="w-full border p-2 rounded"
            value={form.mobile}
            onChange={e => setForm({ ...form, mobile: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            New Password <span className="text-gray-500">(optional)</span>
          </label>
          <input
            type="password"
            className="w-full border p-2 rounded"
            placeholder="Leave blank to keep current password"
            onChange={e => setForm({ ...form, password: e.target.value })}
          />
        </div>

        <div>
          <p className="font-semibold mb-2">Assign Zones</p>
          <div className="grid grid-cols-2 gap-2">
            {zones.map(z => (
              <label
                key={z._id}
                className="flex items-center gap-2 border p-2 rounded"
              >
                <input
                  type="checkbox"
                  checked={form.assignedZones.includes(z._id)}
                  onChange={() => toggleZone(z._id)}
                />
                {z.name}
              </label>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="bg-black text-white px-6 py-2 rounded"
          >
            Update Zone Admin
          </button>
        </div>
      </form>
    </div>
    );
}

export default function EditZoneAdmin() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <EditZoneAdminInner />
    </Suspense>
  );
}


