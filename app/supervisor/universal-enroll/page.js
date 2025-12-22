"use client";

import { useEffect, useRef, useState } from "react";

export default function SupervisorUniversalEnrollPage() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraFacing, setCameraFacing] = useState("user"); // user | environment
  const [status, setStatus] = useState("initialising camera…");
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [samples, setSamples] = useState([]);
  const [busy, setBusy] = useState(false);

  // ---------------- CAMERA + MODELS ----------------
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        setStatus("requesting camera…");

        // stop old stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: cameraFacing },
        });

        if (cancelled) return;

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        setStatus("loading face models…");
        const faceapi = await import("face-api.js");

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);

        if (cancelled) return;

        setModelsLoaded(true);
        setStatus("camera ready — capture 3 samples");
      } catch (err) {
        console.error(err);
        setStatus("camera error");
      }
    }

    init();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [cameraFacing]);

  // ---------------- CAPTURE SAMPLE ----------------
  async function handleCapture() {
    if (busy || !modelsLoaded) return;
    setBusy(true);

    try {
      const faceapi = await import("face-api.js");

      const det = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!det) {
        setStatus("no face detected — try again");
        setBusy(false);
        return;
      }

      const descriptor = Array.from(det.descriptor);
      setSamples((prev) => [...prev, descriptor]);
      setStatus(`sample ${samples.length + 1}/3 captured`);
    } catch (e) {
      console.error(e);
      setStatus("capture error");
    } finally {
      setBusy(false);
    }
  }

  async function handleSave() {
  if (samples.length < 3) return;

  setBusy(true);
  setStatus("saving face…");

  try {
    const token = localStorage.getItem("supervisorToken");

    const res = await fetch("/api/supervisor/enroll-face", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({ samples }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      setStatus("save failed: " + (data.message || "unauthorized"));
      return;
    }

    setStatus("✅ Face enrolled successfully");
  } catch (e) {
    console.error(e);
    setStatus("server error");
  } finally {
    setBusy(false);
  }
}

    

     

  // ---------------- UI ----------------
  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-lg font-semibold mb-2">Supervisor Face Enroll</h2>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full rounded-lg bg-black mb-3"
        style={{ height: 260, objectFit: "cover" }}
      />

      <div className="text-sm mb-2">{status}</div>
      <div className="text-sm mb-3">Samples: {samples.length}/3</div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleCapture}
          disabled={busy || !modelsLoaded || samples.length >= 3}
          className="bg-indigo-600 text-white px-4 py-2 rounded"
        >
          Capture
        </button>

        <button
          onClick={handleSave}
          disabled={busy || samples.length < 3}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Save
        </button>

        <button
          onClick={() =>
            setCameraFacing((p) => (p === "user" ? "environment" : "user"))
          }
          className="border px-4 py-2 rounded"
        >
          Switch Camera
        </button>
      </div>
    </div>
  );
}

