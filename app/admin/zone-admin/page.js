"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ZoneAdminListPage() {
  const router = useRouter();
  const [zoneAdmins, setZoneAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadZoneAdmins = async () => {
    try {
      const res = await fetch("/api/zone-admin/list", {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setZoneAdmins(data.zoneAdmins);
      }
    } catch (err) {
      console.error("Failed to load zone admins", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadZoneAdmins();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this Zone Admin?")) return;

    try {
      const res = await fetch(`/api/zone-admin/delete?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        alert("Zone Admin deleted");
        loadZoneAdmins();
      } else {
        alert(data.message || "Delete failed");
      }
    } catch (err) {
      alert("Something went wrong");
    }
  };

  if (loading) return <p className="p-4">Loading...</p>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Zone Admins</h1>
        <button
          onClick={() => router.push("/admin/zone-admin/create")}
          className="bg-black text-white px-4 py-2 rounded"
        >
          + Create Zone Admin
        </button>
      </div>

      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Name</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Assigned Zones</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {zoneAdmins.map((za) => (
            <tr key={za._id}>
              <td className="border p-2">{za.name}</td>
              <td className="border p-2">{za.email}</td>
              <td className="border p-2">
                {za.assignedZones?.map((z) => z.name).join(", ")}
              </td>
              <td className="border p-2">{za.status}</td>
              <td className="border p-2 space-x-2">
                <button
                  onClick={() =>
                    router.push(`/admin/zone-admin/view?id=${za._id}`)
                  }
                  className="text-blue-600"
                >
                  View
                </button>
                <button
                  onClick={() =>
                    router.push(`/admin/zone-admin/edit?id=${za._id}`)
                  }
                  className="text-green-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(za._id)}
                  className="text-red-600"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}

          {zoneAdmins.length === 0 && (
            <tr>
              <td colSpan="5" className="p-4 text-center text-gray-500">
                No Zone Admins found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

