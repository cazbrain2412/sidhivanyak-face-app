"use client"; 
// 👆 This MUST be FIRST line to force client component

import { useEffect, useRef, useState } from "react";

export default function FaceCapture() {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    async function start() {
      setStatus("requesting camera...");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
        setStatus("camera ready");
      } catch (err) {
        setStatus("camera error: " + err.message);
      }
    }
    start();
  }, []);

  async function captureAndSend() {
    console.log("BUTTON CLICKED"); // <-- MUST appear in console
    setStatus("loading face-api...");

    try {
      const faceapi = await import("face-api.js");

      try {
        if (faceapi?.tf?.setBackend) {
          await faceapi.tf.setBackend("webgl");
        }
      } catch {}

      await faceapi.nets.tinyFaceDetector.loadFromUri("/models/");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models/");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models/");

      setStatus("detecting face...");
      const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: 320,
        scoreThreshold: 0.4,
      });

      const result = await faceapi
        .detectSingleFace(videoRef.current, options)
        .withFaceLandmarks()
        .withFaceDescriptor();

      console.log("DETECTION RESULT:", result);

      if (!result || !result.descriptor) {
        setStatus("no face detected — face fully visible please");
        return;
      }

      const descriptor = Array.from(result.descriptor);

      setStatus("sending descriptor to server...");
      const res = await fetch("/api/employees/update-face", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "E001", descriptor }),
      });

      const data = await res.json();
      console.log("SERVER RESPONSE:", data);

      if (!res.ok) {
        setStatus("server error: " + (data.error || res.statusText));
        return;
      }

      setStatus("saved descriptor for " + (data.employee?.code || "E001"));
    } catch (err) {
      console.error("ERROR:", err);
      setStatus("error: " + err.message);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Capture Face Descriptor</h1>
      <p>Status: {status}</p>

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        width="320"
        height="240"
        style={{ border: "1px solid #ccc" }}
      />

      <button
        onClick={captureAndSend}
        style={{
          marginTop: 10,
          padding: "10px 16px",
          borderRadius: 8,
          cursor: "pointer",
          background: "#333",
          color: "#fff",
        }}
      >
        Capture & Save (code: E001)
      </button>
    </div>
  );
}

