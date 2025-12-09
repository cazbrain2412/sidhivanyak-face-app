"use client";

import { useRouter } from "next/navigation";

export default function SupervisorEnrollPage() {
  const router = useRouter();

  function openEnrollCamera() {
    // IMPORTANT: go to FACE ENROLL flow, not punch-in/out
    // This page (/supervisor/face-enroll) is the one with
    // "Capture sample 1 / 2 / 3" etc.
    router.push("/supervisor/face-enroll");
    // If in future you want a special mode (self-enroll),
    // you can change to: router.push("/supervisor/face-enroll?self=1");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="w-full bg-white border-b shadow-sm px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <div className="text-xs text-slate-500">Supervisor App</div>
          <div className="text-lg font-semibold text-slate-800">Enroll Face</div>
          <div className="text-xs text-slate-500 mt-1">
            Capture a few clear samples so the system can recognise you.
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-base font-semibold text-slate-800 mb-2">
            Enroll your face
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            Click the button below to open the camera and enroll your face. We
            recommend taking <span className="font-semibold">3–5 samples</span>{" "}
            in good lighting for best accuracy.
          </p>

          <button
            onClick={openEnrollCamera}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold shadow-md hover:bg-indigo-700"
          >
            Open Camera &amp; Enroll
          </button>

          <p className="mt-4 text-xs text-slate-500">
            Tip: keep the phone at eye level, face fully visible, and avoid strong
            backlight.
          </p>
        </section>
      </main>
    </div>
  );
}

