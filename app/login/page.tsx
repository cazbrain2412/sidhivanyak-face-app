"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError("");

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.message || "Invalid credentials");
      return;
    }

    if (data.role === "SUPER_ADMIN") {
  router.replace("/admin/dashboard");
} else if (data.role === "ZONE_ADMIN") {
  router.replace("/zone-admin/dashboard");
} else if (data.role === "SUPERVISOR") {
  router.replace("/supervisor/dashboard");
} else {
  setError("Unauthorized role");
}
} catch (err) {
  setError("Something went wrong");
} finally {
  setLoading(false);
}
};



        

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
  onSubmit={handleLogin}
  className="bg-white p-8 rounded shadow-md w-96"
>


        
       
      
        <h1 className="text-2xl font-bold mb-6 text-center">
          Login
        </h1>

        {error && (
          <p className="text-red-600 text-sm mb-4">{error}</p>
        )}

        <input
          type="email"
          placeholder="Email"
          className="w-full border p-2 mb-4 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border p-2 mb-6 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-800"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

