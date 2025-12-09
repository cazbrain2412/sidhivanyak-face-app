"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!user.trim() || !pass.trim()) {
      setError("Username and password required");
      return;
    }

    // TODO: replace with real API later
    // for now simple static check to unlock admin panel
    if (user === "admin" && pass === "admin@123") {
      if (typeof window !== "undefined") {
        localStorage.setItem("adminLoggedIn", "1");
      }
      router.push("/admin/dashboard");
      return;
    } else {
      setError("Invalid admin credentials");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <img
            src="/logo.png"
            alt="Siddhi Vinayak Group"
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <div className="text-xs text-slate-500">Admin Panel</div>
            <div className="text-lg font-semibold">Siddhi Vinayak Group</div>
            <div className="text-xs text-slate-400">Super Admin Login</div>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Username
            </label>
            <input
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
              placeholder="admin"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
              placeholder="admin@123"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="text-xs text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 text-white rounded-md py-2.5 text-sm font-medium hover:bg-sky-700 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-[11px] text-center text-slate-400">
          Use this panel to manage zones, divisions, departments, supervisors and employees.
        </p>
      </div>
    </div>
  );
}
