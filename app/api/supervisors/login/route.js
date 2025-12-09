// app/api/supervisors/login/route.js
import dbConnect from "../../../../lib/mongodb";
import Supervisor from "../../../../models/Supervisor";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret123";
const JWT_EXPIRES_IN = "8h";

export async function POST(req) {
  try {
    const { code, password } = await req.json();

    if (!code || !password) {
      return new Response(JSON.stringify({ success: false, error: "Missing code or password" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await dbConnect();

    const sup = await Supervisor.findOne({ code }).lean();
    if (!sup) {
      return new Response(JSON.stringify({ success: false, error: "Supervisor not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const match = await bcrypt.compare(password, sup.passwordHash || "");
    if (!match) {
      return new Response(JSON.stringify({ success: false, error: "Invalid credentials" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // create token (do not include passwordHash)
    const payload = { code: sup.code, name: sup.name, zone: sup.zone, division: sup.division };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return new Response(JSON.stringify({ success: true, token, supervisor: payload }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("supervisor login error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message || String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

