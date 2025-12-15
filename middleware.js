import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export function middleware(req) {
  const token = req.cookies.get("token")?.value;
  const url = req.nextUrl.pathname;

  if (!token) {
    if (url.startsWith("/zone-admin")) {
      return NextResponse.redirect(new URL("/zone-admin/login", req.url));
    }
    return NextResponse.next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🚫 Zone admin cannot access super admin
    if (decoded.role === "ZONE_ADMIN" && url.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/zone-admin/dashboard", req.url));
    }

    // 🚫 Super admin cannot access zone admin dashboard
    if (decoded.role === "SUPER_ADMIN" && url.startsWith("/zone-admin")) {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    return NextResponse.next();
  } catch (err) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/admin/:path*", "/zone-admin/:path*"],
};

