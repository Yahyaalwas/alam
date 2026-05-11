import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;
  const payload = token ? verifyToken(token) : null;

  // Redirect logged-in users away from /login
  if (pathname.startsWith("/login")) {
    if (payload) {
      const dest = payload.role === "MANAGER" ? "/dashboard/manager" : "/dashboard/employee";
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return NextResponse.next();
  }

  // Allow public API routes
  if (pathname.startsWith("/api/auth/login")) {
    return NextResponse.next();
  }

  // Protect all other routes
  if (!payload) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("token");
    return response;
  }

  // Role-based guards
  if (pathname.startsWith("/dashboard/manager") && payload.role !== "MANAGER") {
    return NextResponse.redirect(new URL("/dashboard/employee", request.url));
  }

  if (pathname.startsWith("/dashboard/employee") && payload.role !== "EMPLOYEE") {
    return NextResponse.redirect(new URL("/dashboard/manager", request.url));
  }

  if (pathname === "/dashboard") {
    const dest = payload.role === "MANAGER" ? "/dashboard/manager" : "/dashboard/employee";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
