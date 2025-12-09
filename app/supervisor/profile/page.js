"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SupervisorProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [zone, setZone] = useState("");
  const [division, setDivision] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("supervisorToken");
    if (!token) {
      router.replace("/supervisor/login");
      return;
    }
    setName(localStorage.getItem("supervisorName") || "");
    setCode(localStorage.getItem("supervisorCode") || "");
    setZone(localStorage.getItem("supervisorZone") || "");
    setDivision(localStorage.getItem("supervisorDivision") || "");
  }, [router]);

  function logout() {
    localStorage.removeItem("supervisorToken");
    localStorage.removeItem("supervisorName");
    localStorage.removeItem("supervisorCode");
    localStorage.removeItem("supervisorZone");
    localStorage.removeItem("supervisorDivision");
    router.replace("/supervisor/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="w-full bg-white border-b shadow-sm px-4 py-3">
        <div className="text-xs text-slate-500">Profile</div>
        <div className="font-semibold text-slate-800">Supervisor Profile</div>
      </header>

      <main className="flex-1 px-4 py-4 max-w-xl mx-auto w-full pb-20">
        <section className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-semibold">
              {name ? name[0].toUpperCase() : "S"}
            </div>
            <div>
              <div className="font-semibold text-slate-800">{name || "-"}</div>
              <div className="text-xs text-slate-500">
                Code: {code || "-"}
              </div>
            </div>
          </div>

          <div className="text-sm text-slate-700 space-y-1 mb-4">
            <div>
              <span className="font-medium">Zone:</span> {zone || "-"}
            </div>
            <div>
              <span className="font-medium">Division:</span> {division || "-"}
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
          >
            Logout
          </button>
        </section>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around py-2 text-xs">
        <button
          onClick={() => router.push("/supervisor/dashboard")}
          className="flex flex-col items-center text-slate-600"
        >
          Home
        </button>
        <button
          onClick={() => router.push("/supervisor/attendance")}
          className="flex flex-col items-center text-slate-600"
        >
          Attendance
        </button>
        <button
          onClick={() => router.push("/supervisor/profile")}
          className="flex flex-col items-center text-indigo-600 font-semibold"
        >
          Profile
        </button>
      </nav>
    </div>
  );
}

