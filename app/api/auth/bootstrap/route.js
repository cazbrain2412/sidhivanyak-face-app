import dbConnect from "@/lib/mongodb";
import Admin from "@/models/Admin";
import bcrypt from "bcryptjs";

export async function POST(req) {
  await dbConnect();

  try {
    const existingAdmin = await Admin.findOne();
    if (existingAdmin) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Super Admin already exists",
        }),
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, email, password, mobile } = body;

    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Name, email and password are required",
        }),
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      mobile,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Super Admin created successfully",
        adminId: admin._id,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Bootstrap error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal server error",
      }),
      { status: 500 }
    );
  }
}

