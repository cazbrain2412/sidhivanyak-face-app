"use client";

import { useEffect, useRef, useState } from "react";

export default function AttendancePage() {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [matcher, setMatcher] = useState(null);
  const [labelsMap, setLabelsMap] = useState({}); // code -> name
  const [matchResult, setMatchResult] = useState(null);

  useEffect(() => {
    async function setup() {
      setStatus("loading models...");
      try {
        const faceapi = await import("face-api.js");
        try { if (faceapi?.tf?.setBackend) await faceapi.tf.setBackend("webgl"); } catch(e){}

        await faceapi.nets.tinyFaceDetector.loadFromUri("/models/");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models/");
        await faceapi.nets.faceRecognitionNet.loadFromUri("/models/");

        setStatus("models loaded — fetching descriptors...");
        // fetch descriptors from server
        const res = await fetch("/api/employees/descriptors");
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.error || "Failed to fetch descriptors");

        const employees = payload.employees || [];
        if (employees.length === 0) {
          setStatus("no stored descriptors found (register employees first)");
        } else {
          setStatus("building matcher...");
          const labeledDescriptors = [];
          const map = {};
          for (const emp of employees) {
            const code = emp.code;
            const name = emp.name || code;
            const arr = emp.faceDescriptor || [];
            // convert saved array (numbers) -> Float32Array
            const floatDesc = new Float32Array(arr);
            const ld = new faceapi.LabeledFaceDescriptors(code, [floatDesc]);
            labeledDescriptors.push(ld);
            map[code] = name;
          }
          const fm = new faceapi.FaceMatcher(labeledDescriptors, 0.6); // threshold 0.6
          setMatcher(fm);
          setLabelsMap(map);
          setStatus("matcher ready — starting camera...");
        }

        // start camera
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
        setStatus(prev => (prev.includes("matcher ready") ? "ready — look at camera" : prev));
      } catch (err) {
        console.error(err);
        setStatus("error: " + (err.message || String(err)));
      }
    }

    setup();
  }, []);

  // run recognition once when user clicks "Detect" or automatically every X seconds
  async function detectOnce() {
    if (!matcher) {
      setStatus("matcher not ready");
      return;
    }
    setStatus("detecting...");
    try {
      const faceapi = await import("face-api.js");
      const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 });
      const result = await faceapi.detectSingleFace(videoRef.current, options).withFaceLandmarks().withFaceDescriptor();

      if (!result || !result.descriptor) {
        setMatchResult(null);
        setStatus("no face detected — show full face to camera");
        return;
      }

      const best = matcher.findBestMatch(result.descriptor);
      // best.toString() looks like "E001 (distance)"
      const code = best.label;
      const distance = best.distance;
      if (code === "unknown") {
        setMatchResult({ code: null, name: "Unknown", distance });
        setStatus("no matching employee found");
      } else {
        setMatchResult({ code, name: labelsMap[code] || code, distance });
        setStatus(`matched: ${labelsMap[code] || code} (distance ${distance.toFixed(3)})`);
      }
    } catch (err) {
      console.error(err);
      setStatus("error: " + (err.message || String(err)));
    }
  }

  async function markAttendance() {
    if (!matchResult || !matchResult.code) {
      setStatus("no matched employee to mark attendance");
      return;
    }
    setStatus("marking attendance...");
    try {
      const res = await fetch("/api/attendance/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: matchResult.code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("server error: " + (data?.error || res.statusText));
        return;
      }
      setStatus("attendance marked for " + (matchResult.name || matchResult.code));
    } catch (err) {
      console.error(err);
      setStatus("error: " + (err.message || String(err)));
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Face Attendance</h1>
      <p>Status: {status}</p>

      <video ref={videoRef} autoPlay muted playsInline width="320" height="240" style={{ border: "1px solid #ccc", borderRadius: 8 }} />

      <div style={{ marginTop: 12 }}>
        <button onClick={detectOnce} style={{ padding: "8px 12px", marginRight: 8 }}>Detect</button>
        <button onClick={markAttendance} style={{ padding: "8px 12px" }}>Mark Attendance</button>
      </div>

      <div style={{ marginTop: 16 }}>
        {matchResult ? (
          <div>
            <strong>Matched:</strong> {matchResult.name} ({matchResult.code}) — distance: {matchResult.distance?.toFixed(3)}
          </div>
        ) : (
          <div>No current match</div>
        )}
      </div>
    </div>
  );
}

