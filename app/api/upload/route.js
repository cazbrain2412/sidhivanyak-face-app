import { NextResponse } from "next/server";
import path from "path";
import crypto from "crypto";
import { mkdir, writeFile } from "fs/promises";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const name = String(form.get("name") || "").trim();

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: "Missing document name" }, { status: 400 });
    }

    // file is a Blob in Next route handlers
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = path.extname(file.name || "") || "";
    const safeExt = ext.length <= 10 ? ext : "";
    const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${safeExt}`;

    // Save under public/uploads so it can be viewed by URL
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const filepath = path.join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    return NextResponse.json({
      url: `/uploads/${filename}`,
      originalName: file.name || "",
      name,
    });
  } catch (e) {
    return NextResponse.json({ error: e?.message || "Upload error" }, { status: 500 });
  }
}

