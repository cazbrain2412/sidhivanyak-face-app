"use client";
import { useEffect } from "react";
export default function EnrollPage(){
  useEffect(()=>{ /* optionally redirect to face-capture UI */ },[]);
  return (
    <div style={{padding:20}}>
      <h1>Enroll Face</h1>
      <p>Click below to open camera and enroll your face (3 samples recommended).</p>
      <button onClick={()=> window.location.href = '/supervisor/face-punch?self=1'}>Open Camera & Enroll</button>
    </div>
  );
}
