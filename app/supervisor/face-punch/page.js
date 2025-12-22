"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

/* =========================================================
   INNER COMPONENT — ALL LOGIC LIVES HERE
========================================================= */
function SupervisorFacePunchInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const empCodeParam = searchParams.get("emp");
  const selfMode = searchParams.get("self") === "1";

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraFacing, setCameraFacing] = useState("user"); // user | environment
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [status, setStatus] = useState("initialising camera...");
  const [busy, setBusy] = useState(false);

  const [matchedEmp, setMatchedEmp] = useState(null);
  const [lastActionInfo, setLastActionInfo] = useState("");
  const [lastLocation, setLastLocation] = useState(null);

  /* ================= CAMERA + MODELS ================= */
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        setStatus("requesting camera...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: cameraFacing },
        });

        if (cancelled) return;

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }

        streamRef.current = stream;
        videoRef.current.srcObject = stream;

        setStatus("loading face models...");
        const faceapi = await import("face-api.js");

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);

        if (!cancelled) {
          setModelsLoaded(true);
          setStatus("camera ready");
        }
      } catch (err) {
        setStatus("camera error");
        console.error(err);
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

  /* ================= LOCATION ================= */
  async function getLocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);

      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  }

  /* ================= ATTENDANCE ================= */
  async function markAttendance(action) {
    if (busy || !modelsLoaded) return;
    setBusy(true);

    try {
      const faceapi = await import("face-api.js");

      const detection = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setStatus("No face detected");
        setBusy(false);
        return;
      }

      const descriptor = Array.from(detection.descriptor);
      const location = await getLocation();

      const apiUrl = selfMode
        ? "/api/supervisor/attendance/mark"
        : "/api/attendance/mark";

      const token = selfMode
        ? localStorage.getItem("supervisorToken")
        : localStorage.getItem("token");

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          descriptor,
          action,
          location,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setStatus(data.message || "attendance failed");
        setBusy(false);
        return;
      }

      if (data.employee) setMatchedEmp(data.employee);

      const ts = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      });

      setLastActionInfo(
        action === "in" ? `Punch IN @ ${ts}` : `Punch OUT @ ${ts}`
      );

      if (location) setLastLocation(location);
      setStatus("Attendance marked successfully");
    } catch (err) {
      console.error(err);
      setStatus("error occurred");
    } finally {
      setBusy(false);
    }
  }

  /* ================= UI ================= */
  return (
    <div style={{ padding: 16, maxWidth: 520, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 8 }}>
        {selfMode ? "Supervisor Attendance" : "Employee Attendance"}
      </h2>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: "100%",
          height: 280,
          objectFit: "cover",
          borderRadius: 12,
          background: "#000",
        }}
      />

      <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
        <button
          onClick={() => markAttendance("in")}
          disabled={busy}
          style={{ flex: 1, padding: 10, background: "#16a34a", color: "#fff" }}
        >
          Punch IN
        </button>

        <button
          onClick={() => markAttendance("out")}
          disabled={busy}
          style={{ flex: 1, padding: 10, background: "#dc2626", color: "#fff" }}
        >
          Punch OUT
        </button>
      </div>

      <button
        onClick={() =>
          setCameraFacing((f) => (f === "user" ? "environment" : "user"))
        }
        style={{ marginTop: 8, width: "100%" }}
      >
        Switch Camera
      </button>

      {matchedEmp && (
        <div
          style={{
            marginTop: 12,
            padding: 10,
            background: "#f0fdf4",
            border: "1px solid #16a34a",
          }}
        >
          <strong style={{ fontSize: 16 }}>
            {matchedEmp.name} ({matchedEmp.code})
          </strong>
        </div>
      )}

      {lastActionInfo && (
        <div style={{ marginTop: 6, color: "#166534" }}>
          {lastActionInfo}
        </div>
      )}

      {lastLocation && (
        <div style={{ marginTop: 6, fontSize: 12 }}>
          Location: {lastLocation.lat.toFixed(5)},{" "}
          {lastLocation.lng.toFixed(5)}
        </div>
      )}

      <div style={{ marginTop: 8, fontSize: 12 }}>
        <strong>Status:</strong> {status}
      </div>
    </div>
  );
}

/* =========================================================
   ONLY DEFAULT EXPORT — REQUIRED BY NEXT.JS
========================================================= */
export default function SupervisorFacePunchPage() {
  return <SupervisorFacePunchInner />;
}

