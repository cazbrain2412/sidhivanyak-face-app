"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function SupervisorFaceEnrollInner() {

  const searchParams = useSearchParams();
  const router = useRouter();

  const empCodeParam = searchParams.get("emp") || "";
  const selfMode = searchParams.get("self") === "1";

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [status, setStatus] = useState("initialising camera…");
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [samples, setSamples] = useState([]); // array of Float32 / number[]
  const [busy, setBusy] = useState(false);

  // ---- camera + models ----
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        setStatus("requesting camera…");
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (cancelled) return;
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        setStatus("loading face models…");
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
        setStatus("camera ready — capture 3 samples");
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

  async function captureOneSample() {
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
        setStatus("no face detected — hold still, center face.");
        return null;
      }

      setStatus("sample captured");
      return Array.from(result.descriptor);
    } catch (err) {
      console.error(err);
      setStatus("face detection error: " + (err.message || String(err)));
      return null;
    }
  }

  function averageDescriptors(list) {
    if (!list.length) return [];
    const len = list[0].length;
    const out = new Array(len).fill(0);
    for (const arr of list) {
      for (let i = 0; i < len; i++) {
        out[i] += Number(arr[i]) || 0;
      }
    }
    for (let i = 0; i < len; i++) {
      out[i] /= list.length;
    }
    return out;
  }

  async function handleCaptureClick() {
    if (busy) return;
    setBusy(true);
    try {
      if (!empCodeParam && !selfMode) {
        setStatus("No employee code supplied in URL.");
        setBusy(false);
        return;
      }

      const s = await captureOneSample();
      if (!s) {
        setBusy(false);
        return;
      }

      const nextSamples = [...samples, s];
      setSamples(nextSamples);

      if (nextSamples.length < 3) {
        setStatus(
          `sample ${nextSamples.length}/3 captured — change angle slightly and capture again`
        );
        setBusy(false);
        return;
      }

      // We have 3 samples → send to server
      setStatus("3 samples captured — saving to server…");
      const descriptor = averageDescriptors(nextSamples);
      const codeToSave = empCodeParam || "(self)";

      const body = {
        code: empCodeParam, // server already knows mapping from supervisor token for self
        descriptor,
      };

      const res = await fetch("/api/employees/update-face", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatus("save failed: " + (data.error || data.message || "unknown"));
        return;
      }

      setStatus(`face enrolled for ${codeToSave}. You can now use Punch In/Out.`);
    } catch (err) {
      console.error(err);
      setStatus("error: " + (err.message || String(err)));
    } finally {
      setBusy(false);
    }
  }

  const displayEmpLabel = empCodeParam
    ? empCodeParam
    : selfMode
    ? "(self)"
    : "—";

  const samplesText = samples.length
    ? `Samples captured: ${samples.length}/3`
    : "No samples yet";

  return (
    <div
      style={{
        padding: 16,
        maxWidth: 540,
        margin: "0 auto",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ flex: 1, fontSize: 20, fontWeight: 600, margin: 0 }}>
          Face Enroll
        </h2>
        <button
          onClick={() => router.back()}
          style={{
            borderRadius: 20,
            border: "1px solid #ccc",
            padding: "4px 12px",
            background: "#f9f9f9",
            fontSize: 13,
            cursor: "pointer",
          }}
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
          padding: 12,
          borderRadius: 12,
          border: "1px dashed #ddd",
          background: "#fafafa",
          fontSize: 13,
          marginBottom: 10,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 4 }}>
          Instructions (capture 3 samples)
        </div>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>Use mobile front camera at eye level.</li>
          <li>Sample 1: straight face, look at camera.</li>
          <li>Sample 2: slight left angle.</li>
          <li>Sample 3: slight right angle.</li>
          <li>Ensure good lighting, no strong backlight.</li>
        </ul>
      </div>

      <button
        disabled={busy}
        onClick={handleCaptureClick}
        style={{
          width: "100%",
          padding: "10px 0",
          borderRadius: 10,
          border: "none",
          background: busy ? "#6da5f5" : "#1d68d9",
          color: "#fff",
          fontWeight: 600,
          cursor: busy ? "default" : "pointer",
          marginBottom: 8,
        }}
      >
        {samples.length === 0
          ? "Capture sample 1"
          : samples.length === 1
          ? "Capture sample 2"
          : samples.length === 2
          ? "Capture sample 3"
          : "Re-capture sample (will overwrite)"}
      </button>

      <div style={{ fontSize: 12, color: "#555", marginBottom: 4 }}>
        {samplesText}
      </div>

      <div style={{ fontSize: 12, color: "#555" }}>
        <strong>Status:</strong> {status}
      </div>
    </div>
  );
}

export default function SupervisorFaceEnrollPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-gray-500">Loading...</div>}>
      <SupervisorFaceEnrollInner />
    </Suspense>
  );
}
