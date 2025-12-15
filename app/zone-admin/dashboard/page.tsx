"use client";

import { useEffect, useState } from "react";

export default function ZoneAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [zoneAdmin, setZoneAdmin] = useState<any>(null);

  useEffect(() => {
    fetch("/api/zone-admin/me", {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        setZoneAdmin(data.zoneAdmin);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Zone Admin Dashboard
      </h1>

      <p className="mb-4">
        Welcome, <b>{zoneAdmin?.name}</b>
      </p>

      <div className="bg-white shadow rounded p-4">
        <h2 className="text-lg font-semibold mb-2">Assigned Zones</h2>

        <ul className="list-disc pl-6">
          {zoneAdmin?.assignedZones?.map((z: any) => (
            <li key={z._id}>{z.name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

