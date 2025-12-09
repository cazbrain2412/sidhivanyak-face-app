import fs from "fs";
import path from "path";

export async function POST(req) {
  try {
    const body = await req.json();
    const { filename, data } = body || {};

    if (!filename || !data) {
      return new Response(JSON.stringify({ success: false, error: "filename and data required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.promises.mkdir(uploadsDir, { recursive: true });

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const destPath = path.join(uploadsDir, safeName);

    const base64 = (typeof data === "string" && data.includes(",")) ? data.split(",")[1] : data;
    const buffer = Buffer.from(base64, "base64");

    await fs.promises.writeFile(destPath, buffer);

    const publicUrl = "/uploads/" + safeName;
    return new Response(JSON.stringify({ success: true, url: publicUrl }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("upload error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message || String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
