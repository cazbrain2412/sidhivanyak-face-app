"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Invalid login");
        setLoading(false);
        return;
      }

      // ✅ SINGLE, CLEAN REDIRECT
      if (data.role === "SUPER_ADMIN") {
        router.replace("/admin/dashboard");
      } else if (data.role === "ZONE_ADMIN") {
        router.replace("/zone-admin/dashboard");
      } else {
        setError("Unknown role");
      }
    } catch (err) {
      console.error(err);
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded shadow w-80"
      >
        <h1 className="text-xl font-semibold mb-4">Login</h1>

        {error && (
          <div className="text-red-600 text-sm mb-2">{error}</div>
        )}

        <input
          className="border w-full p-2 mb-3"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="border w-full p-2 mb-4"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          disabled={loading}
          className="bg-black text-white w-full py-2"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

