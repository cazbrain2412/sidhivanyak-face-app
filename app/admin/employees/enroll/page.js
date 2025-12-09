"use client";

export default function AdminRedirectEnroll({ searchParams }) {
  const empCode = searchParams?.emp || "";

  if (!empCode) {
    return (
      <div style={{ padding: 20 }}>
        <h3>No Employee Selected</h3>
        <a href="/admin/employees">Back</a>
      </div>
    );
  }

  if (typeof window !== "undefined") {
    window.location.href = "/supervisor/face-enroll?emp=" + empCode;
  }

  return <div style={{ padding: 20 }}>Redirecting to enrollment...</div>;
}
