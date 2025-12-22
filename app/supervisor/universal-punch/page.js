"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function SupervisorFacePunchInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL params
  const empCodeParam = null;
  const selfMode = false;
  
  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const [cameraFacing, setCameraFacing] = useState("user"); // "user" | "environment"
  const [status, setStatus] = useState("initialising camera...");
  const [threshold, setThreshold] = useState(0.65);
  const [modelsLoaded, setModelsLoaded] = useState(false); 
  const [matchedEmp, setMatchedEmp] = useState(null);
  const [distance, setDistance] = useState(null);
  const [busy, setBusy] = useState(false);

  const [lastActionInfo, setLastActionInfo] = useState("");
 const [lastResult, setLastResult] = useState(null);
/*
lastResult = {
  name,
  code,
  action,   // "IN" | "OUT"
  success,  // true | false
  message
}
*/

  // NEW: location state
  const [locationStatus, setLocationStatus] = useState("");
  const [lastLocation, setLastLocation] = useState(null); // { lat, lng, accuracy }

  // ---------- CAMERA + MODELS (UNIVERSAL, SAFE) ----------
useEffect(() => {
  let cancelled = false;

  async function init() {
    try {
      /* ================= CAMERA ================= */
      setStatus("requesting camera...");

      // stop previous stream (important for switch camera)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacing }, // "user" | "environment"
      });

      if (cancelled) return;

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      /* ================= FACE MODELS ================= */
      setStatus("loading face models...");

      const faceapi = await import("face-api.js");

      try {
        if (faceapi?.tf?.setBackend) {
          await faceapi.tf.setBackend("webgl");
          await faceapi.tf.ready();
        }
      } catch (e) {
        console.warn("TF backend failed, continuing", e);
      }

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
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
}, [cameraFacing]); // ✅ switch camera works here


       
   

  // ---------- LOCATION (ONE-SHOT, PER PUNCH) ----------

  function getLocationOnce() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error("Geolocation not supported on this device"));
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          resolve(coords);
        },
        (err) => {
          reject(err);
        },
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
        }
      );
    });
  }

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
    setLocationStatus("");

    try {
      // 1) capture face
      const descriptor = await captureDescriptor();
      if (!descriptor) {
        setBusy(false);
        return;
      }

      // 2) get location ONCE per punch
      let location = null;
      try {
        setLocationStatus("Getting current location… please allow location access.");
        const coords = await getLocationOnce();
        setLastLocation(coords);
        setLocationStatus(
          `Location captured: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)} (±${Math.round(
            coords.accuracy || 0
          )}m)`
        );
        location = coords;
      } catch (locErr) {
        console.warn("location error", locErr);
        setLocationStatus(
          "Location not available: " + (locErr.message || "please check GPS / permissions")
        );
        // We still continue – attendance is marked even if location fails
      }

      setStatus(`sending ${action.toUpperCase()} to server…`);

const res = await fetch("/api/attendance/mark", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    descriptor,
    action, // "in" or "out"
    location: location
      ? {
          lat: location.lat,
          lng: location.lng,
          accuracy: location.accuracy,
          locationName: location.locationName || "",
        }
      : {},
  }),
});


      

      const data = await res.json();

if (!data.success) {
  setStatus("server: " + (data.message || data.error || "failed"));

  if (data.employee) {
    setMatchedEmp(data.employee);
    setDistance(data.bestDist ?? data.dist ?? null);
  }



  const emp = data.employee || matchedEmp;

setLastResult({
  name: emp?.name || "",
  code: emp?.code || "",
  action: action === "in" ? "PUNCH IN" : "PUNCH OUT",
  success: false,
  message: data.message || data.error || "Attendance failed",
});


  setBusy(false);
  return;
}

// matched employee
if (data.employee) {
  setMatchedEmp(data.employee);
  setDistance(data.bestDist ?? data.dist ?? null);

  // optional strict check
  if (empCodeParam && data?.employee?.code && data.employee.code !== empCodeParam) {
    setStatus(
      `Face belongs to ${data.employee.code}, not ${empCodeParam} — attendance not confirmed`
    );

    // ✅ NEW: mismatch shown clearly
    setLastResult({
      name: data.employee?.name || "",
      code: data.employee?.code || "",
      action: action === "in" ? "PUNCH IN" : "PUNCH OUT",
      success: false,
      message: "Face matched, but employee mismatch",
    });

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

  // ✅ NEW: SUCCESS RESULT FOR BIG BOLD UI
  setLastResult({
    name: data.employee?.name || "",
    code: data.employee?.code || "",
    action: action === "in" ? "PUNCH IN" : "PUNCH OUT",
    success: true,
    message: line,
  });
}

} catch (err) {
  console.error(err);
  setStatus("error: " + (err.message || String(err)));

  // ✅ NEW: error display
  setLastResult({
    name: "",
    code: "",
    action: action === "in" ? "PUNCH IN" : "PUNCH OUT",
    success: false,
    message: err.message || "Unexpected error",
  });
} finally {
  setBusy(false);
}
}

function handleReload() {
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
          onClick={() => router.push("/supervisor/dashboard")}

        >
          Back
        </button>
      </div>

      <div style={{ marginBottom: 8, fontSize: 14 }}>
        <strong>Mode:</strong>{" "}
{empCodeParam
  ? `Employee (${empCodeParam})`
  : selfMode
  ? "Self Attendance"
  : "Universal Attendance"}

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
  onClick={() => {
    // stop current stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    setCameraFacing((prev) =>
      prev === "user" ? "environment" : "user"
    );
    setStatus("switching camera...");
  }}
  style={{
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #ccc",
    background: "#eef2ff",
    fontSize: 13,
    cursor: "pointer",
  }}
>
  Switch Camera
</button>




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
          {lastLocation && (
            <div style={{ marginTop: 4, color: "#155e75", fontSize: 12 }}>
              Location: {lastLocation.lat.toFixed(5)},{" "}
              {lastLocation.lng.toFixed(5)} (±
              {Math.round(lastLocation.accuracy || 0)}m)
            </div>
          )}
        </div>
      )}



{lastResult && (
  <div
    style={{
      marginTop: 14,
      padding: 14,
      borderRadius: 14,
      border: lastResult.success ? "2px solid #22c55e" : "2px solid #ef4444",
      background: lastResult.success ? "#ecfdf5" : "#fef2f2",
      textAlign: "center",
    }}
  >
    <div
      style={{
        fontSize: 18,
        fontWeight: 800,
        color: lastResult.success ? "#166534" : "#7f1d1d",
        marginBottom: 6,
      }}
    >
      {lastResult.success ? "ATTENDANCE MARKED" : "ATTENDANCE FAILED"}
    </div>

    {lastResult.name && (
      <div style={{ fontSize: 16, fontWeight: 700 }}>
        Name: <span style={{ fontWeight: 900 }}>{lastResult.name}</span>
      </div>
    )}

    {lastResult.code && (
      <div style={{ fontSize: 15, marginTop: 4 }}>
        Employee Code:{" "}
        <span style={{ fontWeight: 900 }}>{lastResult.code}</span>
      </div>
    )}

    <div
      style={{
        marginTop: 6,
        fontSize: 14,
        fontWeight: 700,
      }}
    >
      {lastResult.action}
    </div>

    <div style={{ marginTop: 6, fontSize: 13 }}>
      {lastResult.message}
    </div>

    <button
      onClick={() => {
        setLastResult(null);
        setMatchedEmp(null);
        setLastActionInfo("");
        setStatus("ready for next attendance");
      }}
      style={{
        marginTop: 12,
        padding: "10px 18px",
        borderRadius: 10,
        border: "none",
        background: "#2563eb",
        color: "#fff",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      Next Attendance
    </button>
  </div>
)}











      {/* STATUS LINES */}
      <div style={{ marginTop: 4, fontSize: 12, color: "#555" }}>
        <strong>Status:</strong> {status}
      </div>

      {locationStatus && (
        <div style={{ marginTop: 4, fontSize: 12, color: "#0f766e" }}>
          <strong>Location:</strong> {locationStatus}
        </div>
      )}

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


