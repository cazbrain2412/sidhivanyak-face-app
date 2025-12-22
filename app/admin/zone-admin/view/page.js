"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ViewZoneAdmin() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`/api/zone-admin/get?id=${id}`)
      .then(res => res.json())
      .then(res => {
        if (res.success) setData(res.zoneAdmin);
      });
  }, [id]);

  if (!data) return <p className="p-4">Loading...</p>;

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-4">View Zone Admin</h1>

      <p><b>Name:</b> {data.name}</p>
      <p><b>Email:</b> {data.email}</p>
      <p><b>Mobile:</b> {data.mobile}</p>
      <p><b>Status:</b> {data.status}</p>

      <p className="mt-2">
        <b>Assigned Zones:</b>{" "}
        {data.assignedZones.map(z => z.name).join(", ")}
      </p>
    </div>
  );
}

