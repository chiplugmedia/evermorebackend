import { NextResponse } from "next/server";

export function middleware(request) {
  const origin = request.headers.get("origin") || "";
  const allowedOrigins = [
    "https://evermorenetwork.com",
    "https://quickmuse.com",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
  ];

  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
  }

  // Check if origin is allowed or allow same-origin/local dev
  const isAllowed =
    allowedOrigins.includes(origin) ||
    !origin ||
    process.env.NODE_ENV !== "production";

  const allowOrigin = isAllowed && origin ? origin : allowedOrigins[0];

  const headers = {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Allow-Credentials": "true",
  };

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers,
    });
  }

  const response = NextResponse.next();

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
