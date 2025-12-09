"use client";

import { useEffect, useRef, useState } from "react";

export default function Page() {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    async function setup() {
      setStatus("requesting camera...");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;

        setStatus("camera ready — loading face-api models...");

        const faceapi = await import("face-api.js");

        try {
          if (faceapi?.tf?.setBackend) {
            await faceapi.tf.setBackend("webgl");
          }
        } catch (e) {
          // ignore backend errors
        }

        // load models from /public/models — note the trailing slash
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models/");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models/");
        await faceapi.nets.faceRecognitionNet.loadFromUri("/models/");

        setStatus("models loaded — camera ready");
      } catch (err) {
        console.error(err);
        setStatus("error: " + (err && err.message ? err.message : String(err)));
      }
    }

    setup();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Face Test</h1>
      <p>Status: {status}</p>
      <video ref={videoRef} autoPlay muted width="320" height="240" />
    </div>
  );
}

