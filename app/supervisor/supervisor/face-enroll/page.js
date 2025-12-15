"use client";
import React, { useEffect, useRef, useState } from "react";

export default function SupervisorFaceEnrollPageSrc() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("initializing camera...");
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [samples, setSamples] = useState([]);
  const [empCode, setEmpCode] = useState("");

  useEffect(() => {
    try { const sp = new URLSearchParams(window.location.search); setEmpCode(sp.get("emp")||""); } catch(e){}
  }, []);

  useEffect(() => {
    let stream;
    async function s() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }});
        if (videoRef.current) videoRef.current.srcObject = stream;
        setStatus("camera ready");
      } catch (err) {
        setStatus("camera error: " + (err?.message || err));
      }
    }
    s();
    return () => { if (stream) stream.getTracks().forEach(t=>t.stop()); };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadModels() {
      try {
        setStatus("loading face-api models...");
        const faceapi = await import("face-api.js");
        try { if (faceapi?.tf?.setBackend) await faceapi.tf.setBackend("webgl"); } catch(e){}
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models/");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models/");
        await faceapi.nets.faceRecognitionNet.loadFromUri("/models/");
        if (!mounted) return;
        setModelsLoaded(true);
        setStatus("models loaded — camera ready");
      } catch (err) {
        console.error(err);
        setStatus("models load error: " + (err?.message || String(err)));
      }
    }
    loadModels();
    return () => { mounted = false; };
  }, []);

  function drawToCanvas() {
    const v = videoRef.current;
    if(!v) return null;
    const w = v.videoWidth || 640, h = v.videoHeight || 480;
    const c = canvasRef.current || document.createElement("canvas");
    c.width = w; c.height = h;
    c.getContext("2d").drawImage(v, 0, 0, w, h);
    return c;
  }

  async function captureSample() {
    if (!modelsLoaded) { setStatus("models not loaded"); return; }
    setStatus("capturing sample...");
    try {
      const faceapi = await import("face-api.js");
      const c = drawToCanvas();
      if (!c) { setStatus("camera not ready"); return; }
      const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 });
      const det = await faceapi.detectSingleFace(c, options).withFaceLandmarks().withFaceDescriptor();
      if (!det || !det.descriptor) {
        setStatus("no face detected — center your face and try again");
        return;
      }
      const arr = Array.from(det.descriptor);
      setSamples(prev => {
  const next = [...prev, arr];
  setStatus("Captured " + next.length + " / 3");
  return next;
});

    } catch (err) {
      console.error(err);
      setStatus("capture error: " + (err?.message || String(err)));
    }
  }

  function averageDescriptors(list) {
    if (!list || list.length === 0) return [];
    const L = list[0].length;
    const out = new Array(L).fill(0);
    for (const d of list) for (let i=0;i<L;i++) out[i] += Number(d[i]||0);
    for (let i=0;i<L;i++) out[i] = out[i]/list.length;
    return out;
  }

  async function saveEnrollment() {
    if (!empCode) return alert("Employee code missing in URL (emp=...)");
    if (samples.length < 1) return alert("Capture at least 1-3 samples");
    setStatus("averaging descriptors...");
    const averaged = averageDescriptors(samples);
    setStatus("sending to server...");
    try {
      const res = await fetch("/api/employees/update-face", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: empCode, descriptor: averaged })
      });
      const j = await res.json();
      if (!res.ok) { setStatus("server error: " + (j?.error || j?.message || res.statusText)); return; }
      setStatus("Enrollment saved — redirecting to punch screen...");
      setTimeout(() => window.location.href = `/supervisor/face-punch?emp=${encodeURIComponent(empCode)}`, 800);
    } catch (err) {
      console.error(err);
      setStatus("save error: " + (err?.message || String(err)));
    }
  }

  function resetSamples(){ setSamples([]); setStatus("samples cleared"); }

  return (
    <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <h1>Face Enrollment</h1>
      <div style={{ color: "#666" }}>Employee: <strong>{empCode || "(no emp)"}</strong></div>

      <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #ddd", marginTop: 10 }}>
        <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: 360, objectFit: "cover", background: "#000" }} />
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={captureSample} style={{ flex: 1, padding: 12, borderRadius: 8, background: "#1976d2", color: "#fff", border: "none" }}>
          Capture Sample ({samples.length}/3)
        </button>
        <button onClick={resetSamples} style={{ padding: 12, borderRadius: 8 }}>Reset</button>
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={saveEnrollment} disabled={samples.length===0} style={{ padding: "10px 14px", background: "#2e7d32", color: "#fff", border: "none", borderRadius: 8 }}>
          Save Enrollment
        </button>
      </div>

      <div style={{ marginTop: 12, padding: 10, background: "#fff8e1", borderRadius: 6, border: "1px solid #ffecb3" }}>
        <div style={{ fontWeight: 700 }}>Instructions</div>
        <ol style={{ margin: "6px 0 0 18px" }}>
          <li>Face the camera with good lighting.</li>
          <li>Capture 3 samples from slightly different angles.</li>
          <li>Click Save Enrollment to store averaged descriptor.</li>
        </ol>
      </div>

      <div style={{ marginTop: 12, color: "#555" }}><strong>Status:</strong> {status}</div>
    </div>
  );
}
