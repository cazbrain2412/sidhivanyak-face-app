"use client";
import { useState } from "react";

export default function SupervisorLoginPage() {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e && e.preventDefault();
    setError("");
    if (!code.trim() || !password) return setError("Code and password required");
    setLoading(true);
    try {
      const res = await fetch("/api/supervisors/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), password })
      });
      const j = await res.json();
      if (!res.ok || !j.success) {
        setError(j.error || "Login failed");
        setLoading(false);
        return;
      }
      localStorage.setItem("supervisorToken", j.token);
      localStorage.setItem("supervisorCode", j.supervisor?.code || code.trim());
      localStorage.setItem("supervisorName", j.supervisor?.name || "");
      window.location.href = "/supervisor/dashboard";
    } catch (err) {
      console.error(err);
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-md p-6 sm:p-8">
        <div className="flex items-center gap-4">
          {/* Logo — put your company logo at /public/logo.png or change the src */}
          <img src="/logo.png" alt="logo" className="w-14 h-14 rounded-full object-cover" />
          <div>
            <h2 className="text-lg font-semibold">CAZ BRAIN</h2>
            <p className="text-xs text-gray-500">Supervisor sign in</p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Supervisor Code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-3"
              placeholder="Enter your code"
              inputMode="text"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-3"
              placeholder="Your password"
              autoComplete="current-password"
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="flex items-center justify-between gap-3">
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center rounded-md bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <button
              type="button"
              onClick={() => {
                setCode("");
                setPassword("");
                setError("");
              }}
              className="inline-flex items-center justify-center rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </form>

        <p className="mt-6 text-xs text-gray-500 text-center">
          After login you will see Supervisor Dashboard, My Attendance, Assigned employees and quick face enroll.
        </p>

        <p className="mt-4 text-xs text-center text-gray-400">© {new Date().getFullYear()} Caz Brain Pvt. Ltd.</p>
      </div>
    </div>
  );
}
