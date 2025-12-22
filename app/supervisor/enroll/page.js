"use client";

export default function SupervisorEnrollRedirect() {
  if (typeof window !== "undefined") {
    // self=1 tells face-enroll this is supervisor self enroll
    window.location.href = "/supervisor/face-enroll?self=1";
  }

  return <div style={{ padding: 20 }}>Redirecting to supervisor face enroll…</div>;
}

