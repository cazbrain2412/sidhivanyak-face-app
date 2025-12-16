import dbConnect from "@/lib/mongodb";
import ZoneAdmin from "@/models/ZoneAdmin";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

function getTokenFromCookie(req) {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

 
  // DEMO MODE: bypass auth
const decoded = {
  role: "SUPER_ADMIN",
  id: "demo-super-admin"
};


export async function POST(req) {
  await dbConnect();

  try {
    const token = getTokenFromCookie(req);
    if (!token) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

   

    const body = await req.json();
    const { name, email, password, mobile, assignedZones } = body;

    const hashedPassword = await bcrypt.hash(password, 10);

    await ZoneAdmin.create({
      name,
      email,
      password: hashedPassword,
      mobile,
      assignedZones,
      createdBy: decoded.userId || decoded.id,
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("ZONE ADMIN CREATE ERROR:", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

   
    
        
      

