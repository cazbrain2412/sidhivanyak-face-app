"use client";

import { useRouter } from "next/navigation";

export default function SupervisorEnrollPage() {
  const router = useRouter();

  function openCameraForEnroll() {
    // Re-use the same camera page you already have.
    // If later you make a separate /supervisor/face-enroll page,
    // just change this path.
    router.push("/supervisor/face-punch?self=1");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="w-full bg-white border-b shadow-sm px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="text-xs text-slate-500">Supervisor App</div>
          <div className="font-semibold text-slate-800">Enroll Face</div>
          <div className="text-[11px] text-slate-500">
            Capture a few clear samples so the system can recognise you.
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-4 max-w-2xl mx-auto w-full pb-16">
        <section className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-800">
            Enroll your face
          </h2>
          <p className="text-sm text-slate-600">
            Click the button below to open the camera and enroll your face.
            We recommend taking <strong>3–5 samples</strong> in good lighting
            for best accuracy.
          </p>

          <button
            onClick={openCameraForEnroll}
            className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md text-sm hover:bg-indigo-700 active:bg-indigo-800"
          >
            Open Camera &amp; Enroll
          </button>

          <p className="text-[11px] text-slate-500 mt-2">
            Tip: keep the phone at eye level, face fully visible, and avoid
            strong backlight.
          </p>
        </section>
      </main>
    </div>
  );
}
