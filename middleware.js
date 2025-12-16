import { NextResponse } from "next/server";

/**
 * DEMO MODE
 * Auth disabled temporarily for client demo
 */
export function middleware(req) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/zone-admin/:path*",
    "/supervisor/:path*",
  ],
};

