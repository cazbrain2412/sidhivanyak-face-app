import dbConnect from "@/lib/mongodb";
import ZoneAdmin from "@/models/ZoneAdmin";
import { NextResponse } from "next/server";

export async function PUT(req) {
  await dbConnect();
  const body = await req.json();
  const { id, password, ...rest } = body;

  if (password) rest.password = password;

  await ZoneAdmin.findByIdAndUpdate(id, rest);
  return NextResponse.json({ success: true });
}

