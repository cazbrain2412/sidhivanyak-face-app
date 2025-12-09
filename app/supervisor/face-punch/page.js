"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function SupervisorFacePunchInner() {

  const searchParams = useSearchParams();
  const router = useRouter();

  // URL params
  const empCodeParam = searchParams.get("emp") || "";
  const selfMode = searchParams.get("self") === "1";

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState("initialising camera...");
  const [threshold, setThreshold] = useState(0.65);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  const [matchedEmp, setMatchedEmp] = useState(null);
  const [distance, setDistance] = useState(null);
  const [busy, setBusy] = useState(false);

  const [lastActionInfo, setLastActionInfo] = useState("");

  // ---------- CAMERA + MODELS ----------

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        setStatus("requesting camera...");
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (cancelled) return;

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        setStatus("loading face models...");
        const faceapi = await import("face-api.js");

        try {
          if (faceapi?.tf?.setBackend) {
            await faceapi.tf.setBackend("webgl");
            await faceapi.tf.ready();
          }
        } catch (e) {
          console.warn("tf backend set failed", e);
        }

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models/"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models/"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models/"),
        ]);

        if (cancelled) return;
        setModelsLoaded(true);
        setStatus("camera ready");
      } catch (err) {
        console.error(err);
        setStatus("camera error: " + (err.message || String(err)));
      }
    }

    init();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // ---------- FACE CAPTURE & ATTENDANCE ----------

  async function captureDescriptor() {
    if (!videoRef.current) {
      setStatus("video not ready");
      return null;
    }
    if (!modelsLoaded) {
      setStatus("models still loading…");
      return null;
    }

    try {
      const faceapi = await import("face-api.js");
      const options = new faceapi.TinyFaceDetectorOptions();

      setStatus("detecting face…");
      const result = await faceapi
        .detectSingleFace(videoRef.current, options)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!result || !result.descriptor) {
        setStatus("no face detected — move closer / center face");
        return null;
      }

      setStatus("face detected");
      return Array.from(result.descriptor);
    } catch (err) {
      console.error(err);
      setStatus("face detection error: " + (err.message || String(err)));
      return null;
    }
  }

  async function markAttendance(action) {
    if (busy) return;
    setBusy(true);
    setLastActionInfo("");
    try {
      const descriptor = await captureDescriptor();
      if (!descriptor) {
        setBusy(false);
        return;
      }

      setStatus(`sending ${action.toUpperCase()} to server…`);

      const res = await fetch("/api/attendance/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descriptor,
          action, // "in" or "out"
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setStatus("server: " + (data.message || data.error || "failed"));
        if (data.employee) {
          setMatchedEmp(data.employee);
          setDistance(data.bestDist ?? data.dist ?? null);
        }
        setBusy(false);
        return;
      }

      // matched employee
      if (data.employee) {
        setMatchedEmp(data.employee);
        setDistance(data.bestDist ?? data.dist ?? null);
      }

      // optional strict check: if emp=E300 in URL but match is different, warn
      if (empCodeParam && data?.employee?.code && data.employee.code !== empCodeParam) {
        setStatus(
          `Face belongs to ${data.employee.code}, not ${empCodeParam} — attendance not counted.`
        );
        setBusy(false);
        return;
      }

      const rec = data.record || {};
      const inToday = data.inToday || !!rec.punchIn;
      const outToday = data.outToday || !!rec.punchOut;

      const ts =
        rec.punchIn || rec.punchOut || rec.createdAt
          ? new Date(rec.punchOut || rec.punchIn || rec.createdAt).toLocaleString()
          : new Date().toLocaleString();

      const line =
        action === "in"
          ? `Punch IN done at ${ts}`
          : `Punch OUT done at ${ts}`;

      setLastActionInfo(line);
      setStatus(
        `OK: ${line} • present=${inToday && outToday ? "YES" : "pending"}`
      );
    } catch (err) {
      console.error(err);
      setStatus("error: " + (err.message || String(err)));
    } finally {
      setBusy(false);
    }
  }

  function handleReload() {
    // simple reload of page & state
    router.refresh();
  }

  const displayEmpLabel = matchedEmp
    ? `${matchedEmp.name || matchedEmp.code} — ${matchedEmp.code}`
    : empCodeParam
    ? empCodeParam
    : selfMode
    ? "(self)"
    : "—";

  // ---------- UI ----------

  return (
    <div
      style={{
        padding: 16,
        maxWidth: 480,
        margin: "0 auto",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ flex: 1, fontSize: 20, fontWeight: 600, margin: 0 }}>
          Face Punch
        </h2>
        <button
          style={{
            border: "1px solid #ccc",
            borderRadius: 20,
            padding: "4px 12px",
            fontSize: 13,
            background: "#f9f9f9",
            cursor: "pointer",
          }}
          onClick={() => router.back()}
        >
          Back
        </button>
      </div>

      <div style={{ marginBottom: 8, fontSize: 14 }}>
        <strong>Employee:</strong> {displayEmpLabel}
      </div>

      <div
        style={{
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid #e2e2e2",
          background: "#000",
          marginBottom: 12,
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: "100%",
            height: 280,
            objectFit: "cover",
            backgroundColor: "#111",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <button
          disabled={busy}
          onClick={() => markAttendance("in")}
          style={{
            flex: 1,
            padding: "10px 0",
            borderRadius: 8,
            border: "none",
            background: busy ? "#7cc58b" : "#1b873f",
            color: "#fff",
            fontWeight: 600,
            cursor: busy ? "default" : "pointer",
          }}
        >
          Punch In
        </button>
        <button
          disabled={busy}
          onClick={() => markAttendance("out")}
          style={{
            flex: 1,
            padding: "10px 0",
            borderRadius: 8,
            border: "none",
            background: busy ? "#ccc" : "#444",
            color: "#fff",
            fontWeight: 500,
            cursor: busy ? "default" : "pointer",
          }}
        >
          Punch Out
        </button>
        <button
          onClick={handleReload}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #ccc",
            background: "#f7f7f7",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Reload
        </button>
      </div>

      {matchedEmp && (
        <div
          style={{
            borderRadius: 12,
            border: "1px solid #d4ebd8",
            background: "#f4fff6",
            padding: 10,
            marginBottom: 10,
            fontSize: 13,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 2 }}>
            {matchedEmp.name || matchedEmp.code}
          </div>
          <div style={{ color: "#555" }}>
            Code: {matchedEmp.code}{" "}
            {matchedEmp.mobile ? `• ${matchedEmp.mobile}` : ""}
          </div>
          {distance != null && (
            <div style={{ color: "#777", marginTop: 4 }}>
              Match distance: {distance.toFixed(3)} (threshold {threshold})
            </div>
          )}
          {lastActionInfo && (
            <div style={{ marginTop: 4, color: "#157347" }}>
              {lastActionInfo}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 4, fontSize: 12, color: "#555" }}>
        <strong>Status:</strong> {status}
      </div>

      <div style={{ marginTop: 8, fontSize: 12 }}>
        <div style={{ marginBottom: 4 }}>Threshold</div>
        <input
          type="range"
          min="0.4"
          max="0.9"
          step="0.01"
          value={threshold}
          onChange={(e) => setThreshold(parseFloat(e.target.value))}
          style={{ width: "100%" }}
        />
        <div style={{ textAlign: "right", color: "#666" }}>
          {threshold.toFixed(2)}
        </div>
      </div>

      <div style={{ marginTop: 10, fontSize: 11, color: "#777" }}>
        Tip: hold phone at eye level, good lighting, face centered. If matching
        fails, re-enroll the employee face once from the Enroll screen.
      </div>
    </div>
  );
}

export default function SupervisorFacePunchPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-gray-500">Loading...</div>}>
      <SupervisorFacePunchInner />
    </Suspense>
  );
}
