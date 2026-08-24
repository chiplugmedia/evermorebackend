import { NextResponse } from "next/server";

export function middleware(request) {
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "https://evermorenetwork.com",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  const response = NextResponse.next();

  response.headers.set(
    "Access-Control-Allow-Origin",
    "https://evermorenetwork.com",
  );

  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );

  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
